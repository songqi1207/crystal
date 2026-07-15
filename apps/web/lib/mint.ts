import {
  createPublicClient,
  createWalletClient,
  decodeEventLog,
  http,
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  astrayaCertificateAbi,
  getContractAddressForKind,
  integrityHashToBytes32,
  type CertificateKind,
} from "./astraya-abi";
import { getAstrayaChain } from "./web3-chains";

/**
 * Phase 2 · M3 mint pipeline.
 *
 * All on-chain minting runs through the platform's MINTER_ROLE signer
 * (ASTRAYA_MINTER_PRIVATE_KEY). The buyer / asker *receives* the NFT at
 * their previously-bound `User.walletAddress`, but never signs the mint
 * themselves — this matches the UX we promised in Phase 1 (gas-less for
 * the end user) and keeps nonce management server-side.
 */

export type MintSkipReason =
  | "contract_not_configured"
  | "minter_key_missing"
  | "already_minted"
  | "no_wallet_bound";

export class MintConfigError extends Error {
  readonly reason: MintSkipReason;
  constructor(reason: MintSkipReason, message: string) {
    super(message);
    this.name = "MintConfigError";
    this.reason = reason;
  }
}

export interface MintCertificateInput {
  kind: CertificateKind;
  to: Address;
  integrityHash: string; // 64-char hex (no 0x) or 0x-prefixed; both accepted
  tokenUri: string;
}

export interface MintCertificateResult {
  tokenId: string;
  txHash: Hex;
  contractAddress: Address;
  chainId: number;
}

function readMinterKey(): Hex | undefined {
  const raw = (process.env.ASTRAYA_MINTER_PRIVATE_KEY ?? "").trim();
  if (!raw) return undefined;
  const withPrefix = raw.startsWith("0x") ? raw : `0x${raw}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(withPrefix)) {
    throw new MintConfigError(
      "minter_key_missing",
      "ASTRAYA_MINTER_PRIVATE_KEY is set but is not a 32-byte hex key",
    );
  }
  return withPrefix as Hex;
}

/** Surface-level readiness probe used by the API route before touching RPC. */
export function getMintReadiness(kind: CertificateKind):
  | { ready: true; contractAddress: Address }
  | { ready: false; reason: MintSkipReason; message: string } {
  const contractAddress = getContractAddressForKind(kind);
  if (!contractAddress) {
    return {
      ready: false,
      reason: "contract_not_configured",
      message:
        kind === "consultation"
          ? "NEXT_PUBLIC_DIVINATION_CONTRACT 未配置，链上铸造暂未开启"
          : "NEXT_PUBLIC_CERTIFICATE_CONTRACT 未配置，链上铸造暂未开启",
    };
  }
  const key = readMinterKey();
  if (!key) {
    return {
      ready: false,
      reason: "minter_key_missing",
      message: "ASTRAYA_MINTER_PRIVATE_KEY 未配置，链上铸造暂未开启",
    };
  }
  return { ready: true, contractAddress };
}

function buildClients(): {
  publicClient: PublicClient;
  walletClient: WalletClient;
  minterAddress: Address;
  chainId: number;
} {
  const chainInfo = getAstrayaChain();
  const keyHex = readMinterKey();
  if (!keyHex) {
    throw new MintConfigError(
      "minter_key_missing",
      "ASTRAYA_MINTER_PRIVATE_KEY 未配置，无法签署铸造交易",
    );
  }
  const account = privateKeyToAccount(keyHex);
  const transport = http(chainInfo.rpcUrl);
  const publicClient = createPublicClient({
    chain: chainInfo.chain,
    transport,
  });
  const walletClient = createWalletClient({
    chain: chainInfo.chain,
    transport,
    account,
  });
  return {
    publicClient,
    walletClient,
    minterAddress: account.address,
    chainId: chainInfo.chainId,
  };
}

/**
 * Mint a certificate NFT. Throws `MintConfigError` for deterministic config
 * problems (no contract address, no minter key, already minted) and lets
 * viem errors (RPC / revert) bubble up so the API route can surface them.
 */
export async function mintCertificate(
  input: MintCertificateInput,
): Promise<MintCertificateResult> {
  const readiness = getMintReadiness(input.kind);
  if (!readiness.ready) {
    throw new MintConfigError(readiness.reason, readiness.message);
  }
  const { contractAddress } = readiness;
  const integrityBytes = integrityHashToBytes32(input.integrityHash);

  const { publicClient, walletClient, chainId } = buildClients();

  // Pre-flight: bail before spending gas if this hash was already minted.
  const existing = (await publicClient.readContract({
    address: contractAddress,
    abi: astrayaCertificateAbi,
    functionName: "tokenIdByHash",
    args: [integrityBytes],
  })) as bigint;
  if (existing > 0n) {
    throw new MintConfigError(
      "already_minted",
      `该证书已铸造为 tokenId #${existing.toString()}`,
    );
  }

  const account = walletClient.account;
  if (!account) {
    throw new MintConfigError(
      "minter_key_missing",
      "walletClient 缺少 account，无法发送交易",
    );
  }

  const { request } = await publicClient.simulateContract({
    account,
    address: contractAddress,
    abi: astrayaCertificateAbi,
    functionName: "mint",
    args: [input.to, integrityBytes, input.tokenUri],
  });

  const txHash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
  });

  if (receipt.status !== "success") {
    throw new Error(`mint transaction reverted (txHash=${txHash})`);
  }

  // Decode the CertificateMinted event to recover the tokenId. Fall back to
  // a second read of tokenIdByHash if the event is missing (should not happen
  // on our contracts but keeps us robust).
  let tokenId: bigint | null = null;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== contractAddress.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: astrayaCertificateAbi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "CertificateMinted") {
        tokenId = decoded.args.tokenId as bigint;
        break;
      }
    } catch {
      /* non-matching log, ignore */
    }
  }
  if (tokenId === null) {
    tokenId = (await publicClient.readContract({
      address: contractAddress,
      abi: astrayaCertificateAbi,
      functionName: "tokenIdByHash",
      args: [integrityBytes],
    })) as bigint;
  }
  if (tokenId === 0n) {
    throw new Error("mint succeeded but tokenId could not be resolved");
  }

  return {
    tokenId: tokenId.toString(),
    txHash,
    contractAddress,
    chainId,
  };
}
