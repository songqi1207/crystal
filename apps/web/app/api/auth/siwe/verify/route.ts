import { NextResponse } from "next/server";
import { z } from "zod";
import { SiweMessage } from "siwe";
import { prisma } from "@astraya/db";
import {
  SIWE_NONCE_COOKIE,
  verifyNonce,
} from "@/lib/siwe-nonce";
import { getAstrayaChain, isWeb3Enabled } from "@/lib/web3-chains";

const bodySchema = z.object({
  message: z.string().min(1).max(4000),
  signature: z.string().min(1).max(512),
  email: z.string().email(),
});

/**
 * POST /api/auth/siwe/verify
 *
 * Consumes a SIWE message + signature, validates both the server-issued
 * nonce cookie and the cryptographic signature, then binds the recovered
 * wallet address to the user identified by `email`.
 *
 * Response (200):   { ok: true, walletAddress }
 * Response (400):   { ok: false, error: string, detail?: string }
 */
export async function POST(req: Request) {
  if (!isWeb3Enabled()) {
    return NextResponse.json(
      { ok: false, error: "web3_disabled" },
      { status: 403 },
    );
  }

  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_body", detail: parsed.error.issues },
      { status: 400 },
    );
  }
  const { message, signature, email } = parsed.data;

  // 1. Parse the SIWE message first — if it's malformed we can fail cheap
  //    before touching the DB or the cookie.
  let siwe: SiweMessage;
  try {
    siwe = new SiweMessage(message);
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "malformed_siwe_message",
        detail: (err as Error).message,
      },
      { status: 400 },
    );
  }

  // 2. Enforce chain binding. A spoofed message targeting the wrong chain
  //    should never be accepted even if the signature is valid.
  const expectedChain = getAstrayaChain();
  if (siwe.chainId !== expectedChain.chainId) {
    return NextResponse.json(
      {
        ok: false,
        error: "wrong_chain",
        detail: `expected chainId=${expectedChain.chainId} (${expectedChain.displayName})`,
      },
      { status: 400 },
    );
  }

  // 3. Validate the nonce cookie that was minted by /nonce.
  const cookieValue = req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SIWE_NONCE_COOKIE}=`))
    ?.slice(SIWE_NONCE_COOKIE.length + 1);

  const nonceCheck = verifyNonce(cookieValue, siwe.nonce);
  if (!nonceCheck.ok) {
    return NextResponse.json(
      { ok: false, error: nonceCheck.error ?? "nonce_failed" },
      { status: 400 },
    );
  }

  // 4. Cryptographically verify the signature — this also re-checks the
  //    SIWE domain/nonce invariants.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const expectedDomain = safeDomain(siteUrl);
  try {
    const verification = await siwe.verify({
      signature,
      nonce: siwe.nonce,
      domain: expectedDomain,
    });
    if (!verification.success) {
      return NextResponse.json(
        { ok: false, error: "siwe_verify_failed" },
        { status: 400 },
      );
    }
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "siwe_verify_failed",
        detail: (err as Error).message,
      },
      { status: 400 },
    );
  }

  const wallet = siwe.address.toLowerCase();

  // 5. Make sure this wallet isn't already bound to a *different* user.
  const existingByWallet = await prisma.user.findUnique({
    where: { walletAddress: wallet },
  });
  const existingByEmail = await prisma.user.findUnique({ where: { email } });

  if (
    existingByWallet &&
    existingByEmail &&
    existingByWallet.id !== existingByEmail.id
  ) {
    return NextResponse.json(
      { ok: false, error: "wallet_bound_to_other_account" },
      { status: 409 },
    );
  }
  if (existingByWallet && !existingByEmail) {
    // Wallet was previously bound to an anonymous account — reject to keep
    // the email↔wallet mapping strictly bijective per user.
    return NextResponse.json(
      { ok: false, error: "wallet_bound_to_other_account" },
      { status: 409 },
    );
  }

  // 6. Upsert: create the user if this is their first visit, otherwise
  //    patch the walletAddress onto the existing record.
  const saved = await prisma.user.upsert({
    where: { email },
    update: { walletAddress: wallet },
    create: { email, walletAddress: wallet },
    select: { email: true, walletAddress: true },
  });

  // 7. Burn the nonce cookie so it cannot be replayed.
  const res = NextResponse.json({ ok: true, walletAddress: saved.walletAddress });
  res.cookies.set(SIWE_NONCE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/siwe",
    maxAge: 0,
  });
  return res;
}

function safeDomain(siteUrl: string): string {
  try {
    return new URL(siteUrl).host;
  } catch {
    return "localhost:3000";
  }
}
