"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

export type MintedInfo = {
  tokenId: string;
  txHash: string;
  contractAddress: string;
  chainId: number;
  explorerUrl: string | null;
  mintedAt?: string | Date | null;
};

type Props = {
  /** Certificate row id (Certificate.id in the DB). */
  certificateId: string;
  /** Whether Web3 is globally enabled (NEXT_PUBLIC_ENABLE_WEB3). */
  enabled: boolean;
  /** Pre-existing on-chain state loaded from the server. */
  initialMinted?: MintedInfo | null;
  /**
   * When true, the button renders a compact pill variant suitable for inline
   * placement next to a certificate header. Otherwise it renders the full
   * card-sized call-to-action.
   */
  compact?: boolean;
  /** Human label shown when not minted yet. */
  label?: string;
};

type UiState =
  | { kind: "idle" }
  | { kind: "minting" }
  | { kind: "error"; message: string }
  | { kind: "minted"; info: MintedInfo };

function explorerTxFallback(txHash: string): string {
  const chain = (process.env.NEXT_PUBLIC_CHAIN ?? "base-sepolia").toLowerCase();
  const base =
    chain === "base"
      ? "https://basescan.org"
      : chain === "hardhat"
        ? ""
        : "https://sepolia.basescan.org";
  return base ? `${base}/tx/${txHash}` : "";
}

function shortHash(h: string, head = 8, tail = 6): string {
  if (!h) return "";
  if (h.length <= head + tail + 2) return h;
  return `${h.slice(0, head)}…${h.slice(-tail)}`;
}

export function MintCertificateButton({
  certificateId,
  enabled,
  initialMinted,
  compact,
  label = "铸造为链上 NFT",
}: Props) {
  const [state, setState] = useState<UiState>(
    initialMinted ? { kind: "minted", info: initialMinted } : { kind: "idle" },
  );

  async function mint() {
    setState({ kind: "minting" });
    try {
      const resp = await fetch(
        `/api/certificates/${encodeURIComponent(certificateId)}/mint`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || !json.ok) {
        const msg = json.error ?? `mint 失败 (HTTP ${resp.status})`;
        setState({ kind: "error", message: msg });
        return;
      }
      const info: MintedInfo = {
        tokenId: String(json.tokenId),
        txHash: String(json.txHash),
        contractAddress: String(json.contractAddress),
        chainId: Number(json.chainId),
        explorerUrl: json.explorerUrl ?? explorerTxFallback(String(json.txHash)),
        mintedAt: json.mintedAt ?? new Date().toISOString(),
      };
      setState({ kind: "minted", info });
    } catch (err) {
      setState({
        kind: "error",
        message: (err as Error)?.message ?? "mint 网络错误",
      });
    }
  }

  if (!enabled) {
    return (
      <div
        className={
          compact
            ? "inline-flex items-center gap-2 rounded-full border border-pearl-700/40 bg-deepspace-800/40 px-3 py-1.5 text-xs text-pearl-400"
            : "rounded-lg border border-pearl-700/40 bg-deepspace-800/40 p-4 text-sm text-pearl-400"
        }
      >
        <Sparkles className="h-3.5 w-3.5 text-starlight-500" />
        链上铸造尚未开启（NEXT_PUBLIC_ENABLE_WEB3=false）
      </div>
    );
  }

  if (state.kind === "minted") {
    const { info } = state;
    const explorer = info.explorerUrl || explorerTxFallback(info.txHash);
    return (
      <div
        className={
          compact
            ? "inline-flex flex-wrap items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200"
            : "rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100"
        }
      >
        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
        <span>已铸造 · tokenId #{info.tokenId}</span>
        <span className="font-mono text-[11px] text-emerald-200/80">
          tx {shortHash(info.txHash, 10, 8)}
        </span>
        {explorer && (
          <a
            href={explorer}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-emerald-200 hover:text-emerald-100 underline-offset-2 hover:underline"
          >
            BaseScan <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    );
  }

  const minting = state.kind === "minting";

  return (
    <div className={compact ? "inline-flex flex-col gap-1.5" : "space-y-2"}>
      <button
        type="button"
        className={
          compact
            ? "inline-flex items-center gap-2 rounded-full border border-starlight-500/40 bg-starlight-500/10 px-3 py-1.5 text-xs text-starlight-200 hover:bg-starlight-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            : "btn-primary"
        }
        disabled={minting}
        onClick={mint}
      >
        {minting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {minting ? "上链中…" : label}
      </button>

      {state.kind === "error" && (
        <div
          className={
            compact
              ? "inline-flex items-start gap-1.5 text-xs text-red-300"
              : "flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200"
          }
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
          <span>{state.message}</span>
        </div>
      )}

    </div>
  );
}
