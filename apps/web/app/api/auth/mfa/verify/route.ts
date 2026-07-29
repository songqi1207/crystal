import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@astraya/db";
import { getCurrentSession } from "@/lib/auth";
import { decryptTotpSecret, verifyTotp } from "@/lib/totp";

const schema = z.object({ code: z.string().regex(/^\d{6}$/) });

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (session.user.role !== "super_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_code" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mfaSecretEncrypted: true, mfaEnabledAt: true },
  });
  if (!user?.mfaSecretEncrypted || !user.mfaEnabledAt) {
    return NextResponse.json({ error: "mfa_setup_required" }, { status: 409 });
  }

  let valid = false;
  try {
    valid = verifyTotp(decryptTotpSecret(user.mfaSecretEncrypted), parsed.data.code);
  } catch {
    return NextResponse.json({ error: "mfa_unavailable" }, { status: 500 });
  }
  if (!valid) return NextResponse.json({ error: "invalid_code" }, { status: 400 });

  await prisma.userSession.update({
    where: { id: session.sessionId },
    data: { mfaVerifiedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
