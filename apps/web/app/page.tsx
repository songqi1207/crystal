import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Gem, MessageCircle } from "lucide-react";
import { prisma } from "@astraya/db";
import { Starfield } from "@/components/starfield";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { MasterCard, type MasterCardData } from "@/components/master-card";

export const revalidate = 60;

export default async function HomePage() {
  const [products, masters] = await Promise.all([
    prisma.product.findMany({
      where: { published: true, featured: true },
      take: 3,
      orderBy: { createdAt: "desc" },
    }),
    prisma.master.findMany({
      where: { published: true },
      take: 3,
      orderBy: { rating: "desc" },
    }),
  ]);

  const productData: ProductCardData[] = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    nameEn: p.nameEn,
    tagline: p.tagline,
    origin: p.origin,
    chakra: p.chakra,
    priceCents: p.priceCents,
    stock: p.stock,
    images: JSON.parse(p.images) as string[],
  }));

  const masterData: MasterCardData[] = masters.map((m) => ({
    id: m.id,
    displayName: m.displayName,
    title: m.title,
    bio: m.bio,
    specialties: m.specialties,
    baseFeeCents: m.baseFeeCents,
    responseHours: m.responseHours,
    rating: m.rating,
    answeredCount: m.answeredCount,
  }));

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Starfield />
        <div className="container-astra relative py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-starlight-500/40 bg-starlight-500/5 px-4 py-1.5 text-xs tracking-[0.3em] text-starlight-500">
              <Sparkles className="h-3.5 w-3.5" />
              ASTRAYA · 星脉
            </div>
            <h1 className="mt-6 text-balance font-serif text-5xl md:text-6xl leading-tight text-pearl-100">
              在 <span className="glyph">星辰脉络</span> 中，
              <br />
              寻得属于你的那颗石。
            </h1>
            <p className="mt-6 max-w-xl text-base md:text-lg text-pearl-300 leading-relaxed">
              每一颗水晶都来自可追溯的矿脉，配独有 NFC
              芯片与链上凭证。每一次大师解惑，都会为你生成一枚溯源卦象。
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/products" className="btn-primary">
                <Gem className="h-4 w-4" /> 浏览水晶
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/consult" className="btn-amethyst">
                <MessageCircle className="h-4 w-4" /> 向大师问卜
              </Link>
            </div>
          </div>

          {/* Pillars */}
          <div className="mt-20 grid gap-6 md:grid-cols-3">
            {PILLARS.map((p) => (
              <div key={p.title} className="glass p-6">
                <p.icon className="h-6 w-6 text-starlight-500" />
                <h3 className="mt-4 text-lg font-serif text-pearl-100">{p.title}</h3>
                <p className="mt-2 text-sm text-pearl-300/90 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured crystals */}
      <section className="container-astra py-20">
        <SectionHeader
          eyebrow="PHASE 01 · 水晶臻选"
          title="当下能量脉络中的星石"
          subtitle="按脉轮与元素分类，每颗实体都已绑定 NFC 芯片与数字证书。"
          more={{ href: "/products", label: "查看全部水晶" }}
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {productData.map((p) => <ProductCard key={p.slug} p={p} />)}
        </div>
      </section>

      {/* Masters */}
      <section className="container-astra py-20">
        <SectionHeader
          eyebrow="PHASE 02 · 大师解惑"
          title="向承传者提问，获得一枚卦象"
          subtitle="问题加密存档、48 小时内回复、结果生成专属链下证书（Phase 2 可上链回铸）。"
          more={{ href: "/consult", label: "查看全部大师" }}
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {masterData.map((m) => <MasterCard key={m.id} m={m} />)}
        </div>
      </section>

      {/* On-chain teaser */}
      <section className="relative overflow-hidden">
        <Starfield className="opacity-60" />
        <div className="container-astra relative py-24">
          <div className="glass p-10 md:p-14">
            <div className="text-xs tracking-[0.3em] text-starlight-500">PHASE 03 · ON-CHAIN</div>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl text-pearl-100 text-balance">
              从 PDF 证书，到 Base 上的 ERC-721 NFT
            </h2>
            <p className="mt-4 max-w-2xl text-pearl-300 leading-relaxed">
              Phase 1 阶段，我们为每件水晶与每次解惑生成链下 PDF +
              HMAC 哈希证书；Phase 2 上链后，你可一键将证书回铸为 Base
              链上 NFT，NFC 芯片哈希同步写入合约作为物实绑定。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/about#roadmap" className="btn-ghost">
                <ShieldCheck className="h-4 w-4" /> 查看路线图
              </Link>
              <Link href="/verify" className="btn-ghost">
                扫码验真 →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  more,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  more?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl">
        <div className="text-xs tracking-[0.3em] text-starlight-500">{eyebrow}</div>
        <h2 className="mt-3 text-balance">{title}</h2>
        <p className="mt-3 text-pearl-300">{subtitle}</p>
      </div>
      {more && (
        <Link href={more.href} className="text-sm text-pearl-300 hover:text-starlight-500">
          {more.label} →
        </Link>
      )}
    </div>
  );
}

const PILLARS = [
  {
    icon: Gem,
    title: "可追溯的水晶",
    desc: "矿脉、重量、色泽、开光记录全流程存档；NFC 芯片嵌入 + 哈希上链，是数字时代的真品凭证。",
  },
  {
    icon: MessageCircle,
    title: "有承传的大师",
    desc: "紫微斗数 · 塔罗 · 风水 · 水晶疗愈四大体系，每位大师经 KYC + 作品审核上线。",
  },
  {
    icon: ShieldCheck,
    title: "法币与链上并行",
    desc: "MVP 阶段支持 USD/CNY 支付与站内证书；Web3 模块上线后，USDC + ERC-721 无缝切换。",
  },
];
