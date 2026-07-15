import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@astraya/db";
import { formatMoney } from "@astraya/shared";
import { AskForm } from "./ask-form";
import { masterSvgDataUri } from "@/lib/images";

export default async function AskPage({ params }: { params: { id: string } }) {
  const master = await prisma.master.findUnique({ where: { id: params.id } });
  if (!master || !master.published) notFound();
  const avatar = masterSvgDataUri(master.id, master.displayName);

  return (
    <div className="container-astra py-16">
      <Link href={`/consult/${master.id}`} className="text-sm text-pearl-400 hover:text-starlight-500">
        ← 返回大师主页
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr,1fr]">
        <div>
          <div className="text-xs tracking-[0.3em] text-starlight-500">问卜 · ASK A MASTER</div>
          <h1 className="mt-3">向 {master.displayName} 提问</h1>
          <p className="mt-3 text-pearl-300">
            清晰描述你的情境，大师将在 {master.responseHours} 小时内给出解读。
            回答完成后，你会获得一枚独一无二的链下 PDF 卦象证书。
          </p>

          <div className="mt-8">
            <AskForm
              masterId={master.id}
              masterName={master.displayName}
              feeCents={master.baseFeeCents}
            />
          </div>
        </div>

        <aside className="glass p-8 h-max">
          <img
            src={avatar}
            alt={master.displayName}
            className="h-24 w-24 rounded-full ring-1 ring-amethyst-400/40"
          />
          <h3 className="mt-4 font-serif text-xl text-pearl-100">{master.displayName}</h3>
          <p className="mt-1 text-xs tracking-[0.3em] text-starlight-500">{master.title}</p>
          <div className="mt-6 hair-line" />
          <dl className="mt-6 space-y-3 text-sm">
            <Row label="一次解惑费" value={formatMoney(master.baseFeeCents, { currency: "USD", locale: "en" })} />
            <Row label="承诺回复时效" value={`${master.responseHours} 小时内`} />
            <Row label="解答形式" value="文字解读 + 卦象图" />
            <Row label="链下凭证" value="PDF + HMAC 哈希" />
            <Row label="Phase 2 回铸" value="Base · ERC-721" />
          </dl>
          <div className="mt-6 text-xs text-pearl-400 leading-relaxed">
            平台将代收解惑费，资金 {master.responseHours}h 后到账大师；
            若大师超时未回复，将自动全额退回。
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-pearl-300">
      <span className="text-pearl-400">{label}</span>
      <span>{value}</span>
    </div>
  );
}
