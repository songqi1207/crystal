"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gem, Trash2, ShieldCheck, Loader2 } from "lucide-react";
import { formatMoney } from "@astraya/shared";
import { crystalSvgDataUri } from "@/lib/images";
import { EMPTY_SHIPPING_ADDRESS, ShippingAddressForm, type ShippingAddressValue } from "@/components/shipping-address-form";

type CartLine = {
  slug: string;
  name: string;
  nameEn: string;
  priceCents: number;
  quantity: number;
};

const STORAGE_KEY = "astraya.cart.v1";

export default function CartPage() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [address, setAddress] = useState<ShippingAddressValue>(EMPTY_SHIPPING_ADDRESS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}

    // Handle ?add=slug from product detail page.
    const url = new URL(window.location.href);
    const add = url.searchParams.get("add");
    if (add) {
      fetch(`/api/products/${add}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((p: any) => {
          if (!p) return;
          setLines((prev) => {
            const next = [...prev];
            const existing = next.find((l) => l.slug === p.slug);
            if (existing) existing.quantity += 1;
            else
              next.push({
                slug: p.slug,
                name: p.name,
                nameEn: p.nameEn,
                priceCents: p.priceCents,
                quantity: 1,
              });
            return next;
          });
          url.searchParams.delete("add");
          window.history.replaceState({}, "", url.toString());
        });
    }
    setHydrated(true);
    fetch("/api/auth/session")
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => setAccountEmail(body?.user?.email ?? null))
      .catch(() => setAccountEmail(null));
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  function remove(slug: string) {
    setLines((prev) => prev.filter((l) => l.slug !== slug));
  }

  function updateQty(slug: string, q: number) {
    setLines((prev) =>
      prev.map((l) => (l.slug === slug ? { ...l, quantity: Math.max(1, q) } : l))
    );
  }

  const subtotal = lines.reduce((s, l) => s + l.priceCents * l.quantity, 0);
  const shipping = lines.length > 0 ? 2000 : 0;
  const total = subtotal + shipping;

  async function checkout() {
    setError(null);
    if (lines.length === 0) return;
    if (!accountEmail) {
      window.location.href = "/login?next=/cart";
      return;
    }
    if (!address.recipient.trim() || !address.phone.trim() || !address.country || !address.city.trim() || !address.addressLine.trim()) {
      return setError("请填写收件人、联系电话、国家、城市和街道门牌信息。");
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress: address,
          items: lines.map((l) => ({ slug: l.slug, quantity: l.quantity })),
        }),
      });
      if (res.status === 401) {
        window.location.href = "/login?next=/cart";
        return;
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || "下单失败");
      }
      const { code } = (await res.json()) as { code: string };
      localStorage.removeItem(STORAGE_KEY);
      window.location.href = `/my/orders/${code}`;
    } catch (err: any) {
      setError(err.message || "下单失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-astra py-16">
      <div className="max-w-3xl">
        <div className="text-xs tracking-[0.3em] text-starlight-500">CART · 购物袋</div>
        <h1 className="mt-3">你的星石收藏</h1>
        <p className="mt-3 text-pearl-300">
          下单后平台将为每颗水晶锁定对应实体、NFC 芯片与证书。当前为 Phase 1 MVP：
          结算将以 <span className="text-starlight-500">mock 支付</span> 方式通过，
          链上 USDC 通道将在 Phase 2 开放。
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr,1fr]">
        <div className="space-y-4">
          {hydrated && lines.length === 0 && (
            <div className="glass p-10 text-center text-pearl-400">
              购物袋空空如也 ——
              <Link href="/products" className="ml-2 text-starlight-500 hover:underline">
                去挑一颗合你能量的水晶
              </Link>
            </div>
          )}

          {lines.map((l) => (
            <div key={l.slug} className="glass flex gap-5 p-4">
              <img
                src={crystalSvgDataUri(l.slug, l.nameEn)}
                alt={l.name}
                className="h-24 w-24 rounded-xl object-cover"
              />
              <div className="flex-1">
                <Link href={`/products/${l.slug}`} className="font-serif text-lg text-pearl-100 hover:text-starlight-500">
                  {l.name}
                </Link>
                <p className="mt-1 text-xs tracking-[0.2em] text-pearl-400">{l.nameEn}</p>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => updateQty(l.slug, l.quantity - 1)}
                    className="h-7 w-7 rounded-full border border-pearl-400/30 text-pearl-300"
                  >
                    −
                  </button>
                  <span className="w-8 text-center">{l.quantity}</span>
                  <button
                    onClick={() => updateQty(l.slug, l.quantity + 1)}
                    className="h-7 w-7 rounded-full border border-pearl-400/30 text-pearl-300"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="text-right">
                <div className="font-serif text-lg text-starlight-500">
                  {formatMoney(l.priceCents * l.quantity, { currency: "USD", locale: "en" })}
                </div>
                <button
                  onClick={() => remove(l.slug)}
                  className="mt-4 inline-flex items-center gap-1 text-xs text-pearl-400 hover:text-red-300"
                >
                  <Trash2 className="h-3.5 w-3.5" /> 移除
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className="glass p-6 h-max">
          <h3 className="font-serif text-xl text-pearl-100">结算</h3>
          <div className="mt-5 space-y-2 text-sm">
            <Row label="商品" value={formatMoney(subtotal, { currency: "USD", locale: "en" })} />
            <Row label="运费" value={formatMoney(shipping, { currency: "USD", locale: "en" })} />
            <div className="hair-line my-3" />
            <Row label="合计" value={formatMoney(total, { currency: "USD", locale: "en" })} large />
          </div>

          <div className="mt-6 space-y-3">
            <div className="rounded-xl border border-pearl-400/20 bg-night-800/60 px-4 py-3 text-sm text-pearl-300">
              {accountEmail ? `订单账户：${accountEmail}` : "结算前需要登录已验证邮箱"}
            </div>
            <ShippingAddressForm value={address} onChange={setAddress} />
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}

          <button
            onClick={checkout}
            disabled={submitting || lines.length === 0}
            className="btn-primary mt-6 w-full"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gem className="h-4 w-4" />}
            确认下单（模拟支付）
          </button>

          <div className="mt-4 flex items-start gap-2 text-[11px] text-pearl-400 leading-relaxed">
            <ShieldCheck className="h-3.5 w-3.5 mt-0.5 text-starlight-500" />
            下单后我们将锁定对应实体水晶、生成 NFC 哈希与链下证书；
            Phase 2 上线后，你可以在"我的法器"页面将证书回铸为 Base 链上 NFT。
          </div>
        </aside>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(168, 165, 152, 0.25);
          background: rgba(10, 14, 39, 0.6);
          padding: 0.7rem 0.9rem;
          font-size: 0.875rem;
          color: #f0eee6;
          outline: none;
        }
        .input:focus {
          border-color: #e8c37a;
          box-shadow: 0 0 0 3px rgba(232, 195, 122, 0.15);
        }
      `}</style>
    </div>
  );
}

function Row({
  label,
  value,
  large,
}: {
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div className={"flex items-center justify-between " + (large ? "text-base" : "")}>
      <span className="text-pearl-400">{label}</span>
      <span className={large ? "font-serif text-starlight-500" : "text-pearl-100"}>{value}</span>
    </div>
  );
}
