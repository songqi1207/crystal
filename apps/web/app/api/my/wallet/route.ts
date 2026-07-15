import { NextResponse } from "next/server";
import { prisma } from "@astraya/db";

/**
 * GET /api/my/wallet?email=<email>
 *
 * Returns the wallet binding currently associated with the account
 * identified by `email`. Response is always `{ email, walletAddress }`
 * where walletAddress may be `null` when nothing is bound yet.
 *
 * No authentication required — Phase 1 identifies users by email alone.
 * This endpoint is read-only and exposes only the wallet string, which is
 * already a public identifier on-chain.
 */
export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email")?.trim();
  if (!email) {
    return NextResponse.json({ error: "email_required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { email: true, walletAddress: true },
  });

  return NextResponse.json({
    email,
    walletAddress: user?.walletAddress ?? null,
  });
}
