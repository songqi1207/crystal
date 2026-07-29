import { NextResponse } from "next/server";
import {
  SIWE_NONCE_COOKIE,
  issueNonce,
} from "@/lib/siwe-nonce";
import { isWeb3Enabled } from "@/lib/web3-chains";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/auth/siwe/nonce
 *
 * Issues a fresh SIWE nonce and persists its HMAC-signed envelope in an
 * httpOnly cookie scoped to this browser. The client echoes the bare
 * `nonce` inside the SIWE message; `/verify` reads the cookie back to
 * confirm the nonce was actually minted by us.
 */
export async function GET() {
  if (!isWeb3Enabled()) {
    return NextResponse.json(
      { error: "web3_disabled" },
      { status: 403 },
    );
  }
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { nonce, cookieValue, maxAgeSec } = issueNonce();

  const res = NextResponse.json({ nonce });
  res.cookies.set(SIWE_NONCE_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/siwe",
    maxAge: maxAgeSec,
  });
  return res;
}
