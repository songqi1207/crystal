import crypto from "node:crypto";

/**
 * Astraya · SIWE nonce helper.
 *
 * The Phase 2 wallet-binding flow never issues session cookies — it only
 * needs to guarantee that the nonce present in a Sign-In-With-Ethereum
 * message was actually minted by our server and has not expired. We therefore
 * keep the state tiny and self-contained: a short random nonce is packed
 * together with its issue time and an HMAC tag into a single httpOnly cookie.
 *
 * Value layout (ascii, no padding):
 *     <nonceHex>.<issuedAtMs>.<hmacHex>
 *
 * `hmacHex` is HMAC-SHA256 of `<nonceHex>.<issuedAtMs>` keyed by
 * ASTRAYA_SIGNING_SECRET, truncated to the first 16 hex chars (64-bit tag).
 *
 * Rotating ASTRAYA_SIGNING_SECRET invalidates every in-flight nonce.
 */

export const SIWE_NONCE_COOKIE = "astraya_siwe_nonce";
export const SIWE_NONCE_TTL_SEC = 10 * 60; // 10 min

const NONCE_BYTES = 8;

function secret(): string {
  return process.env.ASTRAYA_SIGNING_SECRET || "astraya-dev-secret-change-me";
}

function hmac(data: string): string {
  return crypto
    .createHmac("sha256", secret())
    .update(data)
    .digest("hex")
    .slice(0, 16);
}

export interface IssuedNonce {
  /** The raw nonce the browser must echo back inside the SIWE message. */
  nonce: string;
  /** Full cookie value to persist (pass straight into NextResponse.cookies.set). */
  cookieValue: string;
  /** Cookie max-age (seconds). */
  maxAgeSec: number;
}

export function issueNonce(): IssuedNonce {
  const nonce = crypto.randomBytes(NONCE_BYTES).toString("hex");
  const issuedAt = Date.now();
  const tag = hmac(`${nonce}.${issuedAt}`);
  return {
    nonce,
    cookieValue: `${nonce}.${issuedAt}.${tag}`,
    maxAgeSec: SIWE_NONCE_TTL_SEC,
  };
}

export type NonceVerifyError =
  | "missing_cookie"
  | "malformed_cookie"
  | "tampered_cookie"
  | "expired_cookie"
  | "nonce_mismatch";

export interface NonceVerifyResult {
  ok: boolean;
  error?: NonceVerifyError;
  /** Present only when ok === true. */
  nonce?: string;
}

/**
 * Validate that `claimedNonce` (sent in the SIWE message body) matches what we
 * had minted for this browser via `issueNonce` within the TTL.
 */
export function verifyNonce(
  cookieValue: string | undefined,
  claimedNonce: string,
): NonceVerifyResult {
  if (!cookieValue) return { ok: false, error: "missing_cookie" };

  const parts = cookieValue.split(".");
  if (parts.length !== 3) return { ok: false, error: "malformed_cookie" };
  const nonce = parts[0] ?? "";
  const issuedAtStr = parts[1] ?? "";
  const tag = parts[2] ?? "";
  if (!nonce || !issuedAtStr || !tag) {
    return { ok: false, error: "malformed_cookie" };
  }

  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt)) {
    return { ok: false, error: "malformed_cookie" };
  }

  const expected = hmac(`${nonce}.${issuedAt}`);
  if (!timingSafeEqualHex(expected, tag)) {
    return { ok: false, error: "tampered_cookie" };
  }

  const ageSec = (Date.now() - issuedAt) / 1000;
  if (ageSec < 0 || ageSec > SIWE_NONCE_TTL_SEC) {
    return { ok: false, error: "expired_cookie" };
  }

  if (!timingSafeEqualHex(nonce, claimedNonce)) {
    return { ok: false, error: "nonce_mismatch" };
  }

  return { ok: true, nonce };
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
