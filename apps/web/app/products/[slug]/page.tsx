import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, Truck, Sparkles, Gem } from "lucide-react";
import { prisma } from "@astraya/db";
import { CHAKRAS, ELEMENTS, CATEGORIES, formatMoney, type ChakraKey, type ElementKey, type CategoryKey } from "@astraya/shared";
import { crystalSvgDataUri } from "@/lib/images";

export const revalidate = 60;

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      items: {
        where: { status: "in_stock" },
        include: { blessedByMaster: true },
        take: 5,
      },
    },
  });

  if (!product || !product.published) notFound();

  const chakra = CHAKRAS[product.chakra as ChakraKey];
  const element = ELEMENTS[product.element as ElementKey];
  const category = CATEGORIES[product.category as CategoryKey];
  const firstItem = product.items[0];
  const img = crystalSvgDataUri(product.slug, product.nameEn);

  return (
    <div className="container-astra py-16">
      <Link href="/products" className="text-sm text-pearl-400 hover:text-starlight-500">
        ← 返回水晶臻选
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="glass overflow-hidden">
            <img src={img} alt={product.name} className="w-full object-cover aspect-square" />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-square glass opacity-70 hover:opacity-100">
                <img src={img} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs tracking-[0.3em] text-starlight-500">
            {category?.zh} · {element?.zh}行
          </div>
          <h1 className="mt-3">{product.name}</h1>
          <p className="mt-2 text-sm tracking-[0.2em] text-pearl-400">{product.nameEn}</p>
          <p className="mt-6 text-lg text-pearl-200 italic">{product.tagline}</p>

          <div className="mt-8 flex items-end gap-4">
            <span className="font-serif text-4xl text-starlight-500">
              {formatMoney(product.priceCents, { currency: "USD", locale: "en" })}
            </span>
            <span className="pb-2 text-sm text-pearl-400">
              ≈ {formatMoney(product.priceCnyCents, { currency: "CNY", locale: "zh" })}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {chakra && (
              <span className="chip" style={{ color: chakra.color, borderColor: `${chakra.color}55` }}>
                ● {chakra.zh} {chakra.en}
              </span>
            )}
            <span className="chip">{product.origin}</span>
            <span className="chip">{product.weightGrams}g</span>
          </div>

          <div className="mt-8 space-y-4">
            <Link href={`/cart?add=${product.slug}`} className="btn-primary w-full">
              <Gem className="h-4 w-4" /> 加入购物袋
            </Link>
            <Link href="/consult" className="btn-ghost w-full">
              <Sparkles className="h-4 w-4" /> 配一次大师解惑
            </Link>
          </div>

          <div className="mt-10 grid gap-4 text-sm">
            <Feature icon={ShieldCheck} title="NFC 芯片验真" desc="每颗水晶嵌入 NTAG424 芯片，扫码链上校验。" />
            <Feature icon={Truck} title="全球发货" desc="顺丰 / DHL / EMS 可选，保价运输。" />
            <Feature icon={Sparkles} title="可回铸 NFT" desc="Phase 2 上线后，证书可一键回铸至 Base ERC-721。" />
          </div>
        </div>
      </div>

      <section className="mt-20">
        <div className="text-xs tracking-[0.3em] text-starlight-500">DESCRIPTION</div>
        <h2 className="mt-3">关于这颗水晶</h2>
        <p className="mt-4 max-w-3xl text-pearl-300 leading-loose whitespace-pre-line">
          {product.description}
        </p>
      </section>

      {firstItem && (
        <section className="mt-20">
          <div className="text-xs tracking-[0.3em] text-starlight-500">AVAILABLE PIECES</div>
          <h2 className="mt-3">可选实体</h2>
          <p className="mt-2 text-sm text-pearl-400">
            每一件实体有独立编号与芯片，购买时将锁定对应一件。
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {product.items.map((it) => (
              <div key={it.id} className="glass p-5 flex items-center justify-between">
                <div>
                  <div className="font-mono text-sm text-pearl-200">{it.serialNo}</div>
                  <div className="mt-1 text-xs text-pearl-400">
                    NFC {it.nfcUid.slice(0, 10)}…
                  </div>
                  {it.blessedByMaster && (
                    <div className="mt-2 text-xs text-amethyst-300">
                      ✦ 已由 {it.blessedByMaster.displayName} 开光
                    </div>
                  )}
                </div>
                <span className="chip text-starlight-500 border-starlight-500/50">在库</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof ShieldCheck;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 mt-0.5 text-starlight-500" />
      <div>
        <div className="text-pearl-100">{title}</div>
        <div className="text-xs text-pearl-400 mt-0.5">{desc}</div>
      </div>
    </div>
  );
}
