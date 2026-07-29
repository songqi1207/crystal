import crypto from "node:crypto";
import type { CertificatePayload } from "@astraya/shared";
import { sha256Hex } from "@astraya/shared/hash";

/**
 * Phase 1 certificate format: canonical JSON → sha256 integrity hash →
 * HMAC-SHA256 signature using ASTRAYA_SIGNING_SECRET. Phase 2 will replace
 * HMAC with an on-chain Base ECDSA signature + tokenURI pointing at the same payload.
 */

function getSecret(): string {
  const configured = (process.env.ASTRAYA_SIGNING_SECRET ?? "").trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("ASTRAYA_SIGNING_SECRET must be configured in production");
  }
  return "astraya-dev-secret-change-me";
}

export function canonicalize(payload: CertificatePayload): string {
  // Stable JSON: keys sorted alphabetically to guarantee matching hash.
  const sorted = Object.keys(payload)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = (payload as any)[k];
      return acc;
    }, {});
  return JSON.stringify(sorted);
}

export function buildCertificate(payload: CertificatePayload) {
  const canonical = canonicalize(payload);
  const integrityHash = sha256Hex(canonical);
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(integrityHash)
    .digest("hex");
  return { canonical, integrityHash, signature };
}

export function verifySignature(integrityHash: string, signature: string) {
  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(integrityHash)
    .digest("hex");
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
