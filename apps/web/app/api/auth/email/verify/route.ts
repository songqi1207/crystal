import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@astraya/db";
import {
  SESSION_COOKIE,
  SESSION_TTL_SEC,
  hashLoginCode,
  newSessionToken,
  normalizeEmail,
  safeHashEqual,
  sessionCookieOptions,
} from "@/lib/auth";

const schema = z.object({
  email: z.string().email().max(320),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 400 });
  }

  const email = normalizeEmail(parsed.data.email);
  const loginCode = await prisma.emailLoginCode.findFirst({
    where: { email, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!loginCode || loginCode.expiresAt.getTime() <= Date.now() || loginCode.attempts >= 5) {
    return NextResponse.json({ ok: false, error: "invalid_or_expired_code" }, { status: 400 });
  }

  const expected = hashLoginCode(email, parsed.data.code);
  if (!safeHashEqual(expected, loginCode.codeHash)) {
    const attempts = loginCode.attempts + 1;
    await prisma.emailLoginCode.update({
      where: { id: loginCode.id },
      data: {
        attempts,
        ...(attempts >= 5 ? { consumedAt: new Date() } : {}),
      },
    });
    return NextResponse.json({ ok: false, error: "invalid_or_expired_code" }, { status: 400 });
  }

  const now = new Date();
  const { token, tokenHash } = newSessionToken();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SEC * 1000);

  let user: {
    id: string;
    email: string | null;
    name: string | null;
    role: string;
    mfaEnabledAt: Date | null;
  };
  try {
    user = await prisma.$transaction(async (tx) => {
      const claimed = await tx.emailLoginCode.updateMany({
        where: { id: loginCode.id, consumedAt: null },
        data: { consumedAt: now },
      });
      if (claimed.count !== 1) throw new Error("code_already_consumed");

      const saved = await tx.user.upsert({
        where: { email },
        update: { emailVerified: now },
        create: { email, emailVerified: now },
        select: { id: true, email: true, name: true, role: true, mfaEnabledAt: true },
      });
      const isSuperAdmin = saved.role === "super_admin" || saved.role === "admin";
      await tx.userSession.create({
        data: {
          userId: saved.id,
          tokenHash,
          expiresAt,
          mfaVerifiedAt: isSuperAdmin ? null : now,
        },
      });
      return saved;
    });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_or_expired_code" }, { status: 400 });
  }

  const response = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    mfaSetupRequired:
      (user.role === "super_admin" || user.role === "admin") && !user.mfaEnabledAt,
    mfaRequired:
      (user.role === "super_admin" || user.role === "admin") && Boolean(user.mfaEnabledAt),
  });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
