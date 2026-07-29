import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@astraya/db";
import {
  EMAIL_CODE_TTL_SEC,
  hashLoginCode,
  normalizeEmail,
} from "@/lib/auth";
import { sendLoginCode } from "@/lib/email";

const schema = z.object({ email: z.string().email().max(320) });
const MAX_CODES_PER_WINDOW = 3;

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const email = normalizeEmail(parsed.data.email);
  const windowStart = new Date(Date.now() - EMAIL_CODE_TTL_SEC * 1000);
  const recentCount = await prisma.emailLoginCode.count({
    where: { email, createdAt: { gte: windowStart } },
  });
  if (recentCount >= MAX_CODES_PER_WINDOW) {
    return NextResponse.json(
      { ok: false, error: "too_many_requests" },
      { status: 429 },
    );
  }

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  const record = await prisma.emailLoginCode.create({
    data: {
      email,
      codeHash: hashLoginCode(email, code),
      expiresAt: new Date(Date.now() + EMAIL_CODE_TTL_SEC * 1000),
    },
  });

  let delivery: Awaited<ReturnType<typeof sendLoginCode>>;
  try {
    delivery = await sendLoginCode(email, code, record.id);
  } catch (error) {
    await prisma.emailLoginCode.delete({ where: { id: record.id } }).catch(() => undefined);
    console.error("[/api/auth/email/request]", error);
    return NextResponse.json(
      { ok: false, error: "email_delivery_failed" },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    expiresIn: EMAIL_CODE_TTL_SEC,
    ...(delivery.mode === "console" ? { debugCode: code } : {}),
  });
}
