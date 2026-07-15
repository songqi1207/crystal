import { prisma } from "@astraya/db";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { CHAKRAS } from "@astraya/shared";

export const revalidate = 60;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: { chakra?: string };
}) {
  const where = searchParams?.chakra && searchParams.chakra in CHAKRAS
    ? { published: true, chakra: searchParams.chakra }
    : { published: true };

  const products = await prisma.product.findMany({
    where,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });

  const data: ProductCardData[] = products.map((p) => ({
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

  return (
    <div className="container-astra py-16">
      <div className="max-w-3xl">
        <div className="text-xs tracking-[0.3em] text-starlight-500">水晶臻选 · CRYSTALS</div>
        <h1 className="mt-3">能量脉络中的石</h1>
        <p className="mt-4 text-pearl-300">
          按脉轮筛选你此刻需要的能量。所有水晶均配 NFC 验真芯片与 PDF 溯源证书。
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        <FilterPill active={!searchParams?.chakra} href="/products" label="全部" />
        {Object.entries(CHAKRAS).map(([key, c]) => (
          <FilterPill
            key={key}
            active={searchParams?.chakra === key}
            href={`/products?chakra=${key}`}
            label={`${c.zh} ${c.en}`}
            color={c.color}
          />
        ))}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.map((p) => <ProductCard key={p.slug} p={p} />)}
      </div>

      {data.length === 0 && (
        <p className="mt-20 text-center text-pearl-400">该脉轮下暂无水晶，请换个脉轮探索。</p>
      )}
    </div>
  );
}

function FilterPill({
  active,
  href,
  label,
  color,
}: {
  active: boolean;
  href: string;
  label: string;
  color?: string;
}) {
  return (
    <a
      href={href}
      className={
        active
          ? "chip text-night-900 bg-starlight-500 border-starlight-500"
          : "chip hover:border-starlight-500/70"
      }
      style={active ? {} : color ? { color, borderColor: `${color}55` } : {}}
    >
      {label}
    </a>
  );
}
