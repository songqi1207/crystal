import { NextResponse } from "next/server";
import { prisma } from "@astraya/db";
import { getCurrentSession } from "@/lib/auth";
import { encryptTotpSecret, generateTotpSecret, totpUri } from "@/lib/totp";

export async function POST() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (session.user.role !== "super_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (session.user.mfaEnabled) {
    return NextResponse.json({ error: "mfa_already_enabled" }, { status: 409 });
  }

  const secret = generateTotpSecret();
  await prisma.user.update({
    where: { id: session.user.id },
    data: { mfaSecretEncrypted: encryptTotpSecret(secret), mfaEnabledAt: null },
  });
  return NextResponse.json({
    ok: true,
    secret,
    uri: totpUri(secret, session.user.email),
  });
}
