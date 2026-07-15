import { createHash, createHmac } from "node:crypto";

/**
 * Produce a deterministic SHA-256 hex hash of any string payload.
 * Used as certificate `integrityHash` and divination payload fingerprint.
 */
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * HMAC-SHA256 signature used for certificate tamper-proofing.
 * The signing secret lives only on the server (ASTRAYA_CERT_SECRET).
 */
export function signHmac(secret: string, message: string): string {
  return createHmac("sha256", secret).update(message).digest("hex");
}

export function verifyHmac(secret: string, message: string, signature: string): boolean {
  const expected = signHmac(secret, message);
  if (expected.length !== signature.length) return false;
  // constant-time compare
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * NFC binding hash: binds serial number + chip UID + server secret.
 * Scanning NFC yields a URL containing `code = serialNo`; the verify endpoint
 * re-derives this hash and compares it to the one stored at certificate issuance.
 */
export function computeNfcHash(secret: string, serialNo: string, nfcUid: string): string {
  return signHmac(secret, `${serialNo}|${nfcUid}`);
}
