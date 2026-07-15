export * from "./constants";
export * from "./format";
// NOTE: `./hash` relies on `node:crypto` and must NOT be re-exported here,
// otherwise client components that import from `@astraya/shared` would pull
// node built-ins into the browser bundle. Import it via the subpath instead:
//   import { sha256Hex } from "@astraya/shared/hash";

// Certificate payload shape mirrors future ERC-721 metadata JSON.
export interface CertificatePayload {
  brand: string;
  product: string;
  productEn: string;
  origin: string;
  element: string;
  chakra: string;
  weightGrams: number;
  serialNo: string;
  nfcUid: string;
  nfcHash: string;
  blessedBy?: string | null;
  blessedAt?: string | null;
  orderCode: string;
  issuedAt: string;
}
