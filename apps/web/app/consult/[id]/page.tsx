import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, Clock, ArrowRight } from "lucide-react";
import { prisma } from "@astraya/db";
import { formatMoney, MASTER_REVENUE_SPLIT } from "@astraya/shared";
import { masterSvgDataUri } from "@/lib/images";

export const revalidate = 60;

export default async function MasterDetailPage({ params }: { params: { id: string } }) {
  const master = await prisma.master.findUnique({ where: { id: params.id } });
  if (!master || !master.published) notFound();
  const tags = master.specialties.split(",").map((s) => s.trim()).filter(Boolean);
  const avatar = masterSvgDataUri(master.id, master.displayName);

  return (
    <div className="container-astra py-16">
      <Link href="/consult" className="text-sm text-pearl-400 hover:text-starlight-500">
        ← 返回大师列表
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr,1.2fr]">
        <div className="glass p-8">
          <img
            src={avatar}
            alt={master.displayName}
            className="mx-auto h-40 w-40 rounded-full ring-1 ring-amethyst-400/40"
          />
          <h1 className="mt-6 text-center font-serif text-3xl text-pearl-100">
            {master.displayName}
          </h1>
          <p className="mt-2 text-center text-sm tracking-[0.3em] text-starlight-500">
            {master.title}
          </p>
          <div className="mt-6 flex items-center justify-center gap-5 text-xs text-pearl-400">
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-starlight-500" />
              {master.rating.toFixed(1)}
            </span>
            <span>{master.answeredCount} 次解答</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {master.responseHours}h 回复
            </span>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {tags.map((t) => <span key={t} className="chip">{t}</span>)}
          </div>
          <div className="hair-line my-8" />
          <div className="text-center">
            <div className="text-xs text-pearl-400">一次解惑</div>
            <div className="mt-1 font-serif text-3xl text-starlight-500">
              {formatMoney(master.baseFeeCents, { currency: "USD", locale: "en" })}
            </div>
            <div className="text-xs text-pearl-400 mt-1">
              分成 · 大师 {(MASTER_REVENUE_SPLIT.master * 100) | 0}% /
              平台 {(MASTER_REVENUE_SPLIT.platform * 100) | 0}% /
              储备 {(MASTER_REVENUE_SPLIT.reserve * 100) | 0}%
            </div>
          </div>
          <Link
            href={`/consult/${master.id}/ask`}
            className="btn-amethyst mt-8 w-full"
          >
            立即提问 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-10">
          <div>
            <div className="text-xs tracking-[0.3em] text-starlight-500">关于大师</div>
            <h2 className="mt-3">承传与方法</h2>
            <p className="mt-4 text-pearl-300 leading-loose whitespace-pre-line">{master.bio}</p>
          </div>

          <div>
            <div className="text-xs tracking-[0.3em] text-starlight-500">问卜流程</div>
            <h2 className="mt-3">如何提问</h2>
            <ol className="mt-4 space-y-4 text-sm text-pearl-300">
              {STEPS.map((s, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-starlight-500/40 text-starlight-500 font-serif">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-pearl-100">{s.title}</div>
                    <div className="mt-1 text-pearl-400">{s.desc}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="glass p-5 text-xs text-pearl-400 leading-relaxed">
            说明：本站为文化与精神咨询服务，回复内容不构成医疗、法律、财务建议。
            若 {master.responseHours} 小时内大师无法回复，平台将全额退款。
          </div>
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  {
    title: "描述你的困惑",
    desc: "简述处境、生辰（可选）、希望大师回应的方向。问题将加密存档。",
  },
  {
    title: "支付解惑费",
    desc: "支持信用卡 / Apple Pay / GrabPay / 微信 / 支付宝（按地区）。",
  },
  {
    title: "等待大师解读",
    desc: "大师会在规定时长内回复，平台会为你留一道 48h 自动退款保险。",
  },
  {
    title: "查看链下卦象证书",
    desc: "解答完成后生成独一无二的 PDF 卦象证书；Phase 2 可一键回铸为 NFT。",
  },
];
