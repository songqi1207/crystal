import Link from "next/link";
import { CHAKRAS, type ChakraKey, formatMoney } from "@astraya/shared";
import { crystalSvgDataUri } from "@/lib/images";

export interface ProductCardData {
  slug: string;
  name: string;
  nameEn: string;
  tagline: string;
  origin: string;
  chakra: string;
  priceCents: number;
  stock: number;
  images: string[];
}

export function ProductCard({ p }: { p: ProductCardData }) {
  const chakra = CHAKRAS[p.chakra as ChakraKey];
  const img = crystalSvgDataUri(p.slug, p.nameEn);
  return (
    <Link href={`/products/${p.slug}`} className="group block">
      <div className="glass overflow-hidden transition-all group-hover:-translate-y-1 group-hover:shadow-glow">
        <div className="relative aspect-square bg-night-800">
          <img src={img} alt={p.name} className="h-full w-full object-cover" />
          {chakra && (
            <span
              className="absolute left-4 top-4 chip"
              style={{ borderColor: `${chakra.color}55`, color: chakra.color }}
            >
              ● {chakra.zh}
            </span>
          )}
          {p.stock <= 3 && p.stock > 0 && (
            <span className="absolute right-4 top-4 chip text-starlight-500 border-starlight-500/50">
              仅剩 {p.stock} 颗
            </span>
          )}
          {p.stock === 0 && (
            <span className="absolute right-4 top-4 chip text-pearl-400">
              售罄
            </span>
          )}
        </div>
        <div className="p-5">
          <h3 className="text-lg font-serif text-pearl-100">{p.name}</h3>
          <p className="mt-1 text-xs tracking-[0.2em] text-pearl-400">{p.nameEn}</p>
          <p className="mt-3 line-clamp-2 text-sm text-pearl-300/90">{p.tagline}</p>
          <div className="mt-5 flex items-end justify-between">
            <span className="font-serif text-xl text-starlight-500">
              {formatMoney(p.priceCents, { currency: "USD", locale: "en" })}
            </span>
            <span className="text-xs text-pearl-400">{p.origin}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
