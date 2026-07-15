import { NextResponse } from "next/server";
import { prisma } from "@astraya/db";
import { explorerTxUrl } from "@/lib/web3-chains";

export async function GET(req: Request) {
  const nfc = new URL(req.url).searchParams.get("nfc")?.trim();
  if (!nfc) return NextResponse.json({ ok: false, error: "请提供 NFC UID。" }, { status: 400 });

  const item = await prisma.productItem.findUnique({
    where: { nfcUid: nfc },
    include: {
      product: true,
      blessedByMaster: true,
      certificate: { include: { user: true } },
      orderLines: {
        orderBy: { createdAt: "desc" },
        include: { order: true },
        take: 1,
      },
    },
  });

  if (!item) {
    return NextResponse.json({
      ok: false,
      error: "未找到匹配的 NFC 芯片。请确认 UID 是否来自 Astraya 官方包装，或扫描实体芯片再试。",
    });
  }

  const mostRecentLine = item.orderLines[0];
  const certificate = item.certificate;
  const owner = certificate?.user ?? null;

  const onChain =
    certificate?.tokenId && certificate?.txHash
      ? {
          tokenId: certificate.tokenId,
          txHash: certificate.txHash,
          contractAddress: certificate.contractAddress,
          chainId: certificate.chainId,
          mintedAt: certificate.mintedAt,
          explorerUrl: explorerTxUrl(certificate.txHash),
        }
      : null;

  return NextResponse.json({
    ok: true,
    serialNo: item.serialNo,
    nfcUidMasked: item.nfcUid.replace(/^(.{4}).*(.{4})$/, "$1…$2"),
    product: {
      name: item.product.name,
      nameEn: item.product.nameEn,
      slug: item.product.slug,
      origin: item.product.origin,
    },
    owner: {
      email: owner?.email ? maskEmail(owner.email) : null,
      walletAddress: owner?.walletAddress ?? null,
    },
    blessedBy: item.blessedByMaster?.displayName ?? null,
    orderCode: mostRecentLine?.order.code ?? null,
    integrityHash: certificate?.integrityHash ?? item.nfcHash,
    onChain,
  });
}

function maskEmail(e: string) {
  const [user, host] = e.split("@");
  if (!user || !host) return e;
  const head = user.slice(0, 2);
  const tail = user.slice(-1);
  return `${head}***${tail}@${host}`;
}
