import type { Address, Hex } from "viem";

/**
 * Minimal ABI for AstrayaCertificateBase — just the three surfaces the web
 * backend needs to (a) mint a new certificate NFT, (b) reverse-lookup a
 * tokenId by integrityHash (for /verify), and (c) read the next tokenId for
 * preflight / debugging.
 *
 * The full contract ABI (AccessControl, ERC-2981, ERC-721URIStorage, events)
 * lives in `packages/contracts/artifacts` once compiled; we intentionally
 * keep only this surface in the web bundle to minimise attack surface and
 * keep the client bundle light.
 */
export const astrayaCertificateAbi = [
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "integrityHash", type: "bytes32" },
      { name: "uri", type: "string" },
    ],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  {
    type: "function",
    name: "tokenIdByHash",
    stateMutability: "view",
    inputs: [{ name: "integrityHash", type: "bytes32" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "nextTokenId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "CertificateMinted",
    anonymous: false,
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "integrityHash", type: "bytes32", indexed: true },
      { name: "uri", type: "string", indexed: false },
    ],
  },
] as const;

export type AstrayaCertificateAbi = typeof astrayaCertificateAbi;

export type CertificateKind = "product" | "consultation";

/** Reads a 0x-prefixed address from env and normalises empty → undefined. */
function readAddress(raw: string | undefined): Address | undefined {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return undefined;
  if (!/^0x[0-9a-fA-F]{40}$/.test(trimmed)) return undefined;
  return trimmed as Address;
}

/**
 * Map a Certificate.kind to its deployed contract address.
 *
 * Returns `undefined` when the address is not configured — callers should
 * treat that as "mint disabled on this environment" and surface a friendly
 * UI/API message instead of crashing.
 */
export function getContractAddressForKind(
  kind: CertificateKind,
): Address | undefined {
  if (kind === "consultation") {
    return readAddress(process.env.NEXT_PUBLIC_DIVINATION_CONTRACT);
  }
  return readAddress(process.env.NEXT_PUBLIC_CERTIFICATE_CONTRACT);
}

/** Convert a hex integrity hash (with or without 0x prefix) to bytes32. */
export function integrityHashToBytes32(hash: string): Hex {
  const cleaned = hash.startsWith("0x") ? hash.slice(2) : hash;
  if (cleaned.length !== 64 || !/^[0-9a-fA-F]+$/.test(cleaned)) {
    throw new Error(`integrityHash must be 32-byte hex, got length ${cleaned.length}`);
  }
  return (`0x${cleaned.toLowerCase()}`) as Hex;
}
