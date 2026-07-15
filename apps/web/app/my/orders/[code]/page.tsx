import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@astraya/db";
import { formatMoney, truncateHash } from "@astraya/shared";
import { CertificateViewer } from "@/components/certificate-viewer";
import { MintCertificateBlock } from "@/components/web3/MintCertificateBlock";
import { isWeb3Enabled, explorerTxUrl } from "@/lib/web3-chains";
import type { MintedInfo } from "@/components/web3/MintCertificateButton";

export default async function OrderDetailPage({ params }: { params: { code: string } }) {
  const order = await prisma.order.findUnique({
    where: { code: params.code },
    include: {
      items: { include: { product: true, item: true, certificate: true } },
    },
  });
  if (!order) notFound();

  const web3Enabled = isWeb3Enabled();

  return (
    <div className="container-astra py-16">
      <Link href="/my" className="text-sm text-pearl-400 hover:text-starlight-500">
        ← 返回我的法器
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr,1fr]">
        <div>
          <div className="text-xs tracking-[0.3em] text-starlight-500">ORDER · 订单</div>
          <h1 className="mt-3 font-mono tracking-wider">{order.code}</h1>
          <p className="mt-2 text-sm text-pearl-400">
            下单时间 {new Date(order.createdAt).toLocaleString()} · 状态{" "}
            <span className="text-starlight-500">{order.status}</span>
          </p>

          <div className="mt-8 space-y-4">
            {order.items.map((li) => (
              <div key={li.id} className="glass p-6">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <div className="font-serif text-lg text-pearl-100">{li.product.name}</div>
                    <div className="mt-1 text-xs tracking-[0.2em] text-pearl-400">
                      {li.product.nameEn}
                    </div>
                    {li.item && (
                      <div className="mt-3 text-xs text-pearl-400">
                        <span className="text-starlight-500 font-mono">{li.item.serialNo}</span>
                        {" · "}NFC {truncateHash(li.item.nfcUid, 6, 4)}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-pearl-400">x{li.quantity}</div>
                    <div className="mt-1 font-serif text-starlight-500">
                      {formatMoney(li.unitPriceCents * li.quantity, { currency: "USD", locale: "en" })}
                    </div>
                  </div>
                </div>

                {li.certificate && (
                  <div className="mt-6 border-t border-night-500/60 pt-6 space-y-4">
                    <CertificateViewer
                      payload={JSON.parse(li.certificate.payload)}
                      integrityHash={li.certificate.integrityHash}
                      signature={li.certificate.signature}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-pearl-700/40 bg-deepspace-800/40 p-4">
                      <div>
                        <div className="text-xs tracking-[0.3em] text-starlight-500">
                          ON-CHAIN · 链上凭证
                        </div>
                        <div className="mt-1 text-xs text-pearl-400">
                          将证书 <span className="font-mono text-pearl-200">{li.certificate.code}</span> 铸造为 Base 链上 ERC-721，发送到已绑定的钱包。
                        </div>
                      </div>
                      <MintCertificateBlock
                        certificateId={li.certificate.id}
                        enabled={web3Enabled}
                        initialMinted={
                          li.certificate.tokenId && li.certificate.txHash && li.certificate.contractAddress && li.certificate.chainId != null
                            ? ({
                                tokenId: li.certificate.tokenId,
                                txHash: li.certificate.txHash,
                                contractAddress: li.certificate.contractAddress,
                                chainId: li.certificate.chainId,
                                explorerUrl: explorerTxUrl(li.certificate.txHash),
                                mintedAt: li.certificate.mintedAt ?? null,
                              } satisfies MintedInfo)
                            : null
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <aside className="glass p-6 h-max space-y-4">
          <h3 className="font-serif text-xl text-pearl-100">订单详情</h3>
          <div className="text-sm space-y-2">
            <Row label="商品" value={formatMoney(order.subtotalCents, { currency: "USD", locale: "en" })} />
            <Row label="运费" value={formatMoney(order.shippingCents, { currency: "USD", locale: "en" })} />
            <div className="hair-line my-2" />
            <Row
              label="合计"
              value={formatMoney(order.totalCents, { currency: "USD", locale: "en" })}
              large
            />
          </div>
          <div className="text-xs text-pearl-400 space-y-1">
            <div>支付方式：{order.paymentMethod}</div>
            <div>支付状态：{order.paymentStatus}</div>
          </div>
          <div className="hair-line" />
          <div>
            <div className="text-xs tracking-[0.2em] text-pearl-400">SHIPPING</div>
            <p className="mt-2 text-sm whitespace-pre-line text-pearl-200">
              {order.shippingAddress}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-pearl-400">{label}</span>
      <span className={large ? "font-serif text-starlight-500 text-base" : "text-pearl-100"}>
        {value}
      </span>
    </div>
  );
}
