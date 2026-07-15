import { base, baseSepolia, hardhat, type Chain } from "viem/chains";

/**
 * Astraya · chain config shared between server & client.
 *
 * Chain selection is driven by `NEXT_PUBLIC_CHAIN`:
 *   - "base"         → Base mainnet (chainId 8453)
 *   - "base-sepolia" → Base Sepolia testnet (chainId 84532, default)
 *   - "hardhat"      → local Hardhat node (chainId 31337, dev only)
 */

export type AstrayaChainKey = "base" | "base-sepolia" | "hardhat";

export interface AstrayaChain {
  key: AstrayaChainKey;
  chain: Chain;
  chainId: number;
  displayName: string;
  explorerBaseUrl: string;
  rpcUrl: string;
  /** True for test/dev environments; UI can surface a banner when this is on. */
  isTestnet: boolean;
}

function readKey(): AstrayaChainKey {
  const raw = (process.env.NEXT_PUBLIC_CHAIN ?? "base-sepolia").trim().toLowerCase();
  if (raw === "base") return "base";
  if (raw === "hardhat") return "hardhat";
  return "base-sepolia";
}

function baseMainnetRpc(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL?.trim() || "https://mainnet.base.org"
  );
}

function baseSepoliaRpc(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL?.trim() || "https://sepolia.base.org"
  );
}

export function getAstrayaChain(): AstrayaChain {
  const key = readKey();
  switch (key) {
    case "base":
      return {
        key,
        chain: base,
        chainId: base.id,
        displayName: "Base",
        explorerBaseUrl: "https://basescan.org",
        rpcUrl: baseMainnetRpc(),
        isTestnet: false,
      };
    case "hardhat":
      return {
        key,
        chain: hardhat,
        chainId: hardhat.id,
        displayName: "Hardhat (local)",
        explorerBaseUrl: "http://localhost:8545",
        rpcUrl: "http://127.0.0.1:8545",
        isTestnet: true,
      };
    case "base-sepolia":
    default:
      return {
        key: "base-sepolia",
        chain: baseSepolia,
        chainId: baseSepolia.id,
        displayName: "Base Sepolia",
        explorerBaseUrl: "https://sepolia.basescan.org",
        rpcUrl: baseSepoliaRpc(),
        isTestnet: true,
      };
  }
}

export function isWeb3Enabled(): boolean {
  return (process.env.NEXT_PUBLIC_ENABLE_WEB3 ?? "").trim().toLowerCase() === "true";
}

/** Build a BaseScan address/tx URL for the currently-selected chain. */
export function explorerAddressUrl(address: string): string {
  return `${getAstrayaChain().explorerBaseUrl}/address/${address}`;
}

export function explorerTxUrl(txHash: string): string {
  return `${getAstrayaChain().explorerBaseUrl}/tx/${txHash}`;
}
