import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@astraya/db";
import { formatMoney, truncateHash } from "@astraya/shared";
import { masterSvgDataUri } from "@/lib/images";
import { MintCertificateBlock } from "@/components/web3/MintCertificateBlock";
import type { MintedInfo } from "@/components/web3/MintCertificateButton";
import { isWeb3Enabled, explorerTxUrl } from "@/lib/web3-chains";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ConsultationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/my/consultations/${params.id}`)}`);
  const c = await prisma.consultation.findFirst({
    where: { id: params.id, userId: user.id },
    include: { master: true, certificate: true },
  });
  if (!c) notFound();
  const avatar = masterSvgDataUri(c.master.id, c.master.displayName);
  const web3Enabled = isWeb3Enabled();

  return (
    <div className="container-astra py-16">
      <Link href="/my" className="text-sm text-pearl-400 hover:text-starlight-500">
        ← 返回我的法器
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr,1fr]">
        <div>
          <div className="text-xs tracking-[0.3em] text-amethyst-400">DIVINATION · 解惑</div>
          <h1 className="mt-3">{c.topic} · 向 {c.master.displayName} 的提问</h1>
          <p className="mt-2 text-sm text-pearl-400">
            提交时间 {new Date(c.createdAt).toLocaleString()} · 状态{" "}
            <span className="text-amethyst-300">{c.status}</span>
          </p>

          <div className="mt-8 glass p-8">
            <h3 className="text-xs tracking-[0.3em] text-pearl-400">YOU ASKED</h3>
            <p className="mt-3 text-pearl-100 whitespace-pre-line leading-relaxed">
              {c.question}
            </p>
            {c.birthInfo && (
              <p className="mt-4 text-xs text-pearl-400">关键时间：{c.birthInfo}</p>
            )}
          </div>

          {c.status === "pending" && (
            <div className="mt-6 glass p-8 text-sm text-pearl-300 leading-relaxed">
              大师将在 <span className="text-starlight-500">{c.master.responseHours} 小时</span>
              内回复。我们会在回答生成后通过邮箱通知你，
              并在此处显示完整的解读与 PDF 证书。
            </div>
          )}

          {c.status === "answered" && c.answer && (
            <div className="mt-6 glass p-8">
              <h3 className="text-xs tracking-[0.3em] text-starlight-500">MASTER REPLIED</h3>
              <div className="mt-4 flex items-center gap-3">
                <img src={avatar} alt="" className="h-10 w-10 rounded-full ring-1 ring-amethyst-400/40" />
                <div>
                  <div className="text-pearl-100">{c.master.displayName}</div>
                  <div className="text-xs text-pearl-400">
                    {c.answeredAt ? new Date(c.answeredAt).toLocaleString() : ""}
                  </div>
                </div>
              </div>
              <div className="mt-6 text-pearl-200 whitespace-pre-line leading-loose">
                {c.answer}
              </div>

              {c.certificate && (
                <div className="mt-8 border-t border-night-500/60 pt-6">
                  <div className="text-xs tracking-[0.3em] text-starlight-500">卦象证书</div>
                  <div className="mt-4 glass p-6 text-xs">
                    <Row label="Integrity" value={truncateHash(c.certificate.integrityHash, 10, 8)} />
                    <Row label="HMAC" value={truncateHash(c.certificate.signature, 10, 8)} />
                    <Row label="Issued" value={new Date(c.certificate.createdAt).toLocaleString()} />
                    {c.certificate.tokenId && (
                      <Row label="Token #" value={`#${c.certificate.tokenId}`} />
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amethyst-400/30 bg-amethyst-500/5 p-4">
                    <div>
                      <div className="text-xs tracking-[0.3em] text-amethyst-300">
                        ON-CHAIN · 卦象 NFT
                      </div>
                      <div className="mt-1 text-xs text-pearl-400">
                        将此卦象铸造为 Base 链上 ERC-721，由绑定的钱包收藏。
                      </div>
                    </div>
                    <MintCertificateBlock
                      certificateId={c.certificate.id}
                      enabled={web3Enabled}
                      label="铸造卦象 NFT"
                      initialMinted={
                        c.certificate.tokenId && c.certificate.txHash && c.certificate.contractAddress && c.certificate.chainId != null
                          ? ({
                              tokenId: c.certificate.tokenId,
                              txHash: c.certificate.txHash,
                              contractAddress: c.certificate.contractAddress,
                              chainId: c.certificate.chainId,
                              explorerUrl: explorerTxUrl(c.certificate.txHash),
                              mintedAt: c.certificate.mintedAt ?? null,
                            } satisfies MintedInfo)
                          : null
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="glass p-6 h-max">
          <div className="flex items-center gap-4">
            <img src={avatar} alt={c.master.displayName} className="h-16 w-16 rounded-full ring-1 ring-amethyst-400/40" />
            <div>
              <div className="font-serif text-lg text-pearl-100">{c.master.displayName}</div>
              <div className="text-xs tracking-[0.3em] text-starlight-500">{c.master.title}</div>
            </div>
          </div>
          <div className="hair-line my-5" />
          <dl className="text-sm space-y-2">
            <Row label="解惑费" value={formatMoney(c.feeCents, { currency: "USD", locale: "en" })} />
            <Row label="支付状态" value={c.paymentStatus} />
            <Row label="承诺时效" value={`${c.master.responseHours}h`} />
            <Row label="主题" value={c.topic} />
          </dl>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-pearl-300">
      <span className="text-pearl-400">{label}</span>
      <span className="font-mono text-pearl-200">{value}</span>
    </div>
  );
}
