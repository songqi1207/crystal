"use client";

import dynamic from "next/dynamic";
import { Link2, Sparkles } from "lucide-react";

/**
 * Phase 2 wallet-binding panel, lazy-loaded to keep the RainbowKit / wagmi
 * bundle out of Phase 1 payloads. When `NEXT_PUBLIC_ENABLE_WEB3 !== "true"`
 * we render a tiny teaser card instead so the layout stays consistent.
 */

const LazyPanel = dynamic(() => import("./WalletBindMounted"), {
  ssr: false,
  loading: () => (
    <section className="glass p-6">
      <div className="flex items-center gap-2 text-xs tracking-[0.3em] text-starlight-500">
        <Link2 className="h-3.5 w-3.5" /> ON-CHAIN · 链上钱包
      </div>
      <p className="mt-3 text-sm text-pearl-400">正在加载钱包组件…</p>
    </section>
  ),
});

export function WalletBindSection({ email }: { email: string }) {
  const enabled =
    (process.env.NEXT_PUBLIC_ENABLE_WEB3 ?? "").toLowerCase() === "true";

  if (!enabled) {
    return (
      <section className="glass p-6">
        <div className="flex items-center gap-2 text-xs tracking-[0.3em] text-amethyst-400">
          <Sparkles className="h-3.5 w-3.5" /> PHASE 2 · 预告
        </div>
        <h2 className="mt-3 text-xl">即将上线：链上钱包</h2>
        <p className="mt-2 text-sm text-pearl-400">
          在管理员将 <span className="font-mono">NEXT_PUBLIC_ENABLE_WEB3=true</span>{" "}
          并配置好钱包连接服务后，这里会出现 Sign-In With Ethereum 按钮，
          你可以把当前账户绑定到一个自有钱包，然后把证书一键铸造为链上 NFT。
        </p>
      </section>
    );
  }

  return <LazyPanel email={email} />;
}
