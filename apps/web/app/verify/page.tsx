"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, ScanLine, Loader2, CheckCircle2, XCircle } from "lucide-react";

type VerifyResult =
  | {
      ok: true;
      serialNo: string;
      nfcUidMasked: string;
      product: { name: string; nameEn: string; slug: string; origin: string };
      owner: { email: string | null; walletAddress: string | null };
      blessedBy: string | null;
      orderCode: string | null;
      integrityHash: string;
      onChain: {
        tokenId: string;
        txHash: string;
        contractAddress: string | null;
        chainId: number | null;
        mintedAt: string | null;
        explorerUrl: string;
      } | null;
    }
  | { ok: false; error: string };

function maskAddress(addr: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function VerifyPage() {
  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!uid.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/verify?nfc=${encodeURIComponent(uid.trim())}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ ok: false, error: "网络错误，请稍后再试。" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-astra py-16">
      <div className="max-w-2xl">
        <div className="text-xs tracking-[0.3em] text-starlight-500">VERIFY · 扫码验真</div>
        <h1 className="mt-3">每颗水晶都有来处</h1>
        <p className="mt-3 text-pearl-300">
          当你拿到 Astraya 的水晶，可以扫描包装盒底部的 NFC 芯片，
          或手动输入芯片 UID，校验它是否由 Astraya 官方发行与配对。
        </p>
      </div>

      <form onSubmit={run} className="mt-10 flex max-w-2xl items-center gap-3">
        <div className="relative flex-1">
          <ScanLine className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-starlight-500" />
          <input
            className="input pl-11"
            placeholder="NFC UID（例如 nfc-amethyst-geode-brazil-001）"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
          />
        </div>
        <button className="btn-primary" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          验真
        </button>
        <style jsx>{`
          .input {
            width: 100%;
            border-radius: 999px;
            border: 1px solid rgba(168, 165, 152, 0.3);
            background: rgba(10, 14, 39, 0.6);
            padding: 0.75rem 1.25rem;
            color: #f0eee6;
            outline: none;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 0.875rem;
          }
          .input:focus {
            border-color: #e8c37a;
          }
        `}</style>
      </form>

      {result && result.ok && (
        <div className="mt-10 glass p-8 max-w-3xl">
          <div className="flex items-center gap-3 text-starlight-500">
            <CheckCircle2 className="h-6 w-6" />
            <span className="font-serif text-xl">验证通过 · 这是 Astraya 发行的水晶</span>
          </div>
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <Row label="产品" value={`${result.product.name} / ${result.product.nameEn}`} />
            <Row label="序列号" value={result.serialNo} mono />
            <Row label="NFC UID" value={result.nfcUidMasked} mono />
            <Row label="来源" value={result.product.origin} />
            <Row label="归属邮箱" value={result.owner.email ?? "未绑定"} />
            <Row
              label="归属钱包"
              value={result.owner.walletAddress ? maskAddress(result.owner.walletAddress) : "未绑定"}
              mono
            />
            <Row label="开光大师" value={result.blessedBy ?? "未开光"} />
            <Row label="关联订单" value={result.orderCode ?? "未售出"} mono />
            <Row label="Integrity" value={result.integrityHash.slice(0, 18) + "…"} mono />
          </div>

          <div className="mt-6 rounded-lg border border-pearl-700/40 bg-deepspace-800/50 p-5">
            <div className="flex items-center gap-2 text-xs tracking-[0.3em] text-starlight-500">
              <ShieldCheck className="h-3.5 w-3.5" /> ON-CHAIN · 链上凭证
            </div>
            {result.onChain ? (
              <div className="mt-4 grid gap-2 text-sm">
                <Row label="Token #" value={`#${result.onChain.tokenId}`} mono />
                <Row
                  label="合约"
                  value={
                    result.onChain.contractAddress
                      ? maskAddress(result.onChain.contractAddress)
                      : "—"
                  }
                  mono
                />
                <Row label="Chain ID" value={String(result.onChain.chainId ?? "—")} mono />
                {result.onChain.mintedAt && (
                  <Row
                    label="铸造时间"
                    value={new Date(result.onChain.mintedAt).toLocaleString()}
                  />
                )}
                <a
                  href={result.onChain.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-starlight-500 hover:underline"
                >
                  在 BaseScan 查看交易 →
                </a>
              </div>
            ) : (
              <p className="mt-3 text-sm text-pearl-400">
                该证书尚未铸造为链上 NFT。归属者可在{" "}
                <Link href="/my" className="text-starlight-500 hover:underline">
                  /my
                </Link>{" "}
                登录后一键铸造。
              </p>
            )}
          </div>

          <div className="mt-8">
            <Link href={`/products/${result.product.slug}`} className="btn-ghost">
              查看该水晶详情 →
            </Link>
          </div>
        </div>
      )}

      {result && !result.ok && (
        <div className="mt-10 glass p-8 max-w-3xl border-red-400/30">
          <div className="flex items-center gap-3 text-red-300">
            <XCircle className="h-6 w-6" />
            <span className="font-serif text-xl">未能验证</span>
          </div>
          <p className="mt-3 text-sm text-pearl-300">{result.error}</p>
          <p className="mt-2 text-xs text-pearl-400">
            若你确认芯片来自 Astraya，请联系 support@astraya.io 与我们核对。
          </p>
        </div>
      )}

      {!result && (
        <div className="mt-14 max-w-2xl text-sm text-pearl-400 leading-relaxed">
          提示：演示数据库中，各水晶对应的 NFC UID 形如
          <span className="font-mono text-starlight-500"> nfc-&lt;slug&gt;-001</span>，
          例如 <span className="font-mono">nfc-amethyst-geode-brazil-001</span>。
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-night-500/30 pb-2">
      <span className="text-pearl-400">{label}</span>
      <span className={mono ? "font-mono text-pearl-100" : "text-pearl-100"}>{value}</span>
    </div>
  );
}
