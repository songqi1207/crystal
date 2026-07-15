"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useAccount,
  useChainId,
  useSignMessage,
  useSwitchChain,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { SiweMessage } from "siwe";
import { Link2, ShieldCheck, AlertTriangle, ExternalLink, Loader2 } from "lucide-react";

/**
 * Expected chain id for wallet binding, mirrored from lib/web3-chains.ts.
 * We read it from NEXT_PUBLIC_CHAIN here so the server & client agree.
 */
function expectedChainId(): number {
  const key = (process.env.NEXT_PUBLIC_CHAIN ?? "base-sepolia").toLowerCase();
  if (key === "base") return 8453;
  if (key === "hardhat") return 31337;
  return 84532; // base-sepolia
}

function explorerBaseUrl(): string {
  const key = (process.env.NEXT_PUBLIC_CHAIN ?? "base-sepolia").toLowerCase();
  if (key === "base") return "https://basescan.org";
  if (key === "hardhat") return "";
  return "https://sepolia.basescan.org";
}

function maskAddress(addr: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

type BindState =
  | { kind: "idle" }
  | { kind: "signing" }
  | { kind: "verifying" }
  | { kind: "error"; message: string }
  | { kind: "success"; walletAddress: string };

export function WalletBindCard({ email }: { email: string }) {
  const { address, isConnected } = useAccount();
  const currentChainId = useChainId();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();

  const [bound, setBound] = useState<string | null>(null);
  const [loadingBound, setLoadingBound] = useState(true);
  const [state, setState] = useState<BindState>({ kind: "idle" });

  const expectedId = expectedChainId();
  const wrongChain = isConnected && currentChainId !== expectedId;

  const refreshBound = useCallback(async () => {
    if (!email) {
      setBound(null);
      setLoadingBound(false);
      return;
    }
    setLoadingBound(true);
    try {
      const r = await fetch(`/api/my/wallet?email=${encodeURIComponent(email)}`);
      const json = await r.json();
      setBound(json.walletAddress ?? null);
    } catch {
      setBound(null);
    } finally {
      setLoadingBound(false);
    }
  }, [email]);

  useEffect(() => {
    refreshBound();
  }, [refreshBound]);

  const alreadyBoundToThisWallet =
    bound && address && bound.toLowerCase() === address.toLowerCase();

  const bind = useCallback(async () => {
    if (!address || !email) return;

    if (wrongChain) {
      setState({
        kind: "error",
        message: `请先把钱包切换到目标网络（chainId ${expectedId}）`,
      });
      return;
    }

    setState({ kind: "signing" });
    try {
      // 1. Ask server for a fresh nonce.
      const nonceResp = await fetch("/api/auth/siwe/nonce");
      if (!nonceResp.ok) {
        throw new Error(`nonce 获取失败 (HTTP ${nonceResp.status})`);
      }
      const { nonce } = (await nonceResp.json()) as { nonce: string };

      // 2. Build the SIWE message and ask the wallet to sign it.
      const domain = window.location.host;
      const origin = window.location.origin;
      const issuedAt = new Date();
      const expirationTime = new Date(issuedAt.getTime() + 10 * 60 * 1000);

      const message = new SiweMessage({
        domain,
        address,
        statement: `Bind this wallet to your Astraya account (${email}).`,
        uri: origin,
        version: "1",
        chainId: expectedId,
        nonce,
        issuedAt: issuedAt.toISOString(),
        expirationTime: expirationTime.toISOString(),
      }).prepareMessage();

      const signature = await signMessageAsync({
        message,
        account: address,
      });

      // 3. Send both to /verify and let the server persist the binding.
      setState({ kind: "verifying" });
      const verifyResp = await fetch("/api/auth/siwe/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature, email }),
      });
      const verifyJson = await verifyResp.json();
      if (!verifyResp.ok || !verifyJson.ok) {
        throw new Error(verifyJson.error ?? `HTTP ${verifyResp.status}`);
      }

      setState({ kind: "success", walletAddress: verifyJson.walletAddress });
      setBound(verifyJson.walletAddress);
    } catch (err) {
      const message =
        (err as Error)?.message?.includes("User rejected")
          ? "用户取消了签名"
          : ((err as Error)?.message ?? "绑定失败");
      setState({ kind: "error", message });
    }
  }, [address, email, expectedId, signMessageAsync, wrongChain]);

  return (
    <section className="glass p-6">
      <div className="flex items-center gap-2 text-xs tracking-[0.3em] text-starlight-500">
        <Link2 className="h-3.5 w-3.5" /> ON-CHAIN · 链上钱包
      </div>
      <h2 className="mt-3 text-xl">绑定你的钱包</h2>
      <p className="mt-2 text-sm text-pearl-400">
        Phase 2：使用 Sign-In With Ethereum 证明钱包归属。绑定后可一键把证书铸造为链上 NFT。
      </p>

      <div className="mt-5 space-y-4">
        {/* Current binding status */}
        <div className="rounded-lg border border-pearl-700/40 bg-deepspace-800/60 p-4">
          <div className="text-xs text-pearl-500">当前绑定</div>
          <div className="mt-1 font-mono text-sm text-pearl-100">
            {loadingBound ? "…" : bound ? maskAddress(bound) : "尚未绑定"}
          </div>
          {bound && (
            <a
              href={`${explorerBaseUrl()}/address/${bound}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-starlight-500 hover:underline"
            >
              在浏览器上查看 <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* RainbowKit connect button */}
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-pearl-300">
            {isConnected ? (
              <span>
                已连接：
                <span className="ml-1 font-mono text-pearl-100">
                  {address ? maskAddress(address) : ""}
                </span>
              </span>
            ) : (
              <span>先连接一个钱包（MetaMask / Coinbase Wallet / WalletConnect）</span>
            )}
          </div>
          <ConnectButton
            accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
            chainStatus={{ smallScreen: "icon", largeScreen: "full" }}
            showBalance={false}
          />
        </div>

        {/* Wrong-chain banner */}
        {wrongChain && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
            <div className="flex-1">
              当前链 id 为 <span className="font-mono">{currentChainId}</span>
              ，需要切换到 <span className="font-mono">{expectedId}</span>。
            </div>
            <button
              type="button"
              className="chip text-amber-200 border-amber-400/40 hover:border-amber-200"
              disabled={isSwitching}
              onClick={() =>
                switchChainAsync({ chainId: expectedId }).catch(() => undefined)
              }
            >
              {isSwitching ? "切换中…" : "切到目标链"}
            </button>
          </div>
        )}

        {/* Bind button + status */}
        {isConnected && !wrongChain && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn-primary"
              disabled={
                !email ||
                state.kind === "signing" ||
                state.kind === "verifying" ||
                !!alreadyBoundToThisWallet
              }
              onClick={bind}
            >
              {state.kind === "signing" || state.kind === "verifying" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {alreadyBoundToThisWallet
                ? "已绑定此钱包"
                : state.kind === "signing"
                  ? "请在钱包中签名…"
                  : state.kind === "verifying"
                    ? "服务器验证中…"
                    : bound
                      ? "改绑到此钱包"
                      : `签名并绑定到 ${email}`}
            </button>
            {state.kind === "error" && (
              <div className="text-sm text-red-300">× {state.message}</div>
            )}
            {state.kind === "success" && (
              <div className="text-sm text-emerald-300">
                ✓ 已绑定 {maskAddress(state.walletAddress)}
              </div>
            )}
          </div>
        )}

        {/* Email prompt */}
        {!email && (
          <div className="text-xs text-pearl-500">
            先在上方输入邮箱并查询，才能把钱包绑定到对应账户。
          </div>
        )}
      </div>
    </section>
  );
}
