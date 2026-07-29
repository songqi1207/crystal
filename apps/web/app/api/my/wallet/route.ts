import { NextResponse } from "next/server";
import { prisma } from "@astraya/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/my/wallet
 *
 * Returns the wallet binding currently associated with the account
 * identified by the authenticated session. Response is always
 * `{ email, walletAddress }`
 * where walletAddress may be `null` when nothing is bound yet.
 *
 * A valid session is required so email cannot be used as an enumeration key.
 */
export async function GET() {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { email: true, walletAddress: true },
  });

  return NextResponse.json({
    email: authUser.email,
    walletAddress: user?.walletAddress ?? null,
  });
}
