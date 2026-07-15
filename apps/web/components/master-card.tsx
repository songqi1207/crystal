import Link from "next/link";
import { Star, Clock } from "lucide-react";
import { formatMoney } from "@astraya/shared";
import { masterSvgDataUri } from "@/lib/images";

export interface MasterCardData {
  id: string;
  displayName: string;
  title: string;
  bio: string;
  specialties: string;
  baseFeeCents: number;
  responseHours: number;
  rating: number;
  answeredCount: number;
}

export function MasterCard({ m }: { m: MasterCardData }) {
  const tags = m.specialties.split(",").map((s) => s.trim()).filter(Boolean);
  const avatar = masterSvgDataUri(m.id, m.displayName);
  return (
    <Link href={`/consult/${m.id}`} className="group block">
      <div className="glass p-6 transition-all group-hover:-translate-y-1 group-hover:shadow-glow-amethyst">
        <div className="flex items-start gap-5">
          <img
            src={avatar}
            alt={m.displayName}
            className="h-20 w-20 rounded-full ring-1 ring-amethyst-400/40"
          />
          <div className="flex-1">
            <h3 className="text-lg font-serif text-pearl-100">{m.displayName}</h3>
            <p className="mt-1 text-xs tracking-[0.2em] text-pearl-400">{m.title}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="chip">{t}</span>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-5 line-clamp-3 text-sm text-pearl-300/90 leading-relaxed">{m.bio}</p>
        <div className="mt-5 flex items-center justify-between text-xs text-pearl-400">
          <span className="inline-flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-starlight-500" />
            {m.rating.toFixed(1)} · {m.answeredCount} 次解答
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {m.responseHours}h 内回复
          </span>
        </div>
        <div className="hair-line my-5" />
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-pearl-400">一次解惑</div>
            <div className="font-serif text-xl text-starlight-500">
              {formatMoney(m.baseFeeCents, { currency: "USD", locale: "en" })}
            </div>
          </div>
          <span className="btn-ghost py-2 px-4 text-xs">预约解惑 →</span>
        </div>
      </div>
    </Link>
  );
}
