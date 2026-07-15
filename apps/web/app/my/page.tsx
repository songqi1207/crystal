"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gem, MessageCircle, ArrowRight, Search } from "lucide-react";
import { WalletBindSection } from "@/components/web3/WalletBindSection";

export default function MyPage() {
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [consults, setConsults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("astraya.my.email");
    if (saved) {
      setEmail(saved);
      load(saved);
    }
  }, []);

  async function load(e: string) {
    setLoading(true);
    try {
      const [o, c] = await Promise.all([
        fetch(`/api/orders?email=${encodeURIComponent(e)}`).then((r) => r.json()),
        fetch(`/api/consultations?email=${encodeURIComponent(e)}`).then((r) => r.json()),
      ]);
      setOrders(o.items ?? []);
      setConsults(c.items ?? []);
      setSearched(true);
      localStorage.setItem("astraya.my.email", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-astra py-16">
      <div className="max-w-3xl">
        <div className="text-xs tracking-[0.3em] text-starlight-500">MY ALTAR · 我的法器</div>
        <h1 className="mt-3">收集你的水晶与卦象</h1>
        <p className="mt-3 text-pearl-300">
          Phase 1 我们以邮箱作为轻量识别凭据。Phase 2 上线后将引入钱包登录，
          你的所有订单、证书与卦象都可在链上关联。
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.includes("@")) load(email);
        }}
        className="mt-8 flex max-w-xl items-center gap-3"
      >
        <input
          className="input flex-1"
          placeholder="请输入你下单时使用的邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn-primary" disabled={loading}>
          <Search className="h-4 w-4" /> 查询
        </button>
        <style jsx>{`
          .input {
            border-radius: 999px;
            border: 1px solid rgba(168, 165, 152, 0.3);
            background: rgba(10, 14, 39, 0.6);
            padding: 0.75rem 1.25rem;
            color: #f0eee6;
            outline: none;
          }
          .input:focus {
            border-color: #e8c37a;
          }
        `}</style>
      </form>

      {searched && (
        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <section>
            <div className="flex items-center gap-2 text-xs tracking-[0.3em] text-starlight-500">
              <Gem className="h-3.5 w-3.5" /> 水晶订单
            </div>
            <h2 className="mt-3">我的水晶</h2>
            <div className="mt-6 space-y-3">
              {orders.length === 0 && (
                <div className="glass p-6 text-sm text-pearl-400">
                  还没有订单 · <Link href="/products" className="text-starlight-500 hover:underline">去挑一颗 →</Link>
                </div>
              )}
              {orders.map((o) => (
                <Link
                  key={o.code}
                  href={`/my/orders/${o.code}`}
                  className="glass flex items-center justify-between p-5 hover:shadow-glow"
                >
                  <div>
                    <div className="font-mono text-sm text-pearl-200">{o.code}</div>
                    <div className="mt-1 text-xs text-pearl-400">
                      {new Date(o.createdAt).toLocaleString()} · {o.itemCount} 件
                    </div>
                  </div>
                  <span className="chip text-starlight-500 border-starlight-500/40">{o.status}</span>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 text-xs tracking-[0.3em] text-amethyst-400">
              <MessageCircle className="h-3.5 w-3.5" /> 大师卦象
            </div>
            <h2 className="mt-3">我的解惑</h2>
            <div className="mt-6 space-y-3">
              {consults.length === 0 && (
                <div className="glass p-6 text-sm text-pearl-400">
                  还没有解惑 · <Link href="/consult" className="text-amethyst-300 hover:underline">去提问 →</Link>
                </div>
              )}
              {consults.map((c) => (
                <Link
                  key={c.id}
                  href={`/my/consultations/${c.id}`}
                  className="glass flex items-center justify-between p-5 hover:shadow-glow-amethyst"
                >
                  <div>
                    <div className="text-pearl-100">
                      {c.topic} · 问 {c.masterName}
                    </div>
                    <div className="mt-1 text-xs text-pearl-400">
                      {new Date(c.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <span className="chip text-amethyst-300 border-amethyst-400/40">{c.status}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}

      {searched && (
        <div className="mt-12">
          <WalletBindSection email={email} />
        </div>
      )}
    </div>
  );
}
