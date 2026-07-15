import { NextResponse } from "next/server";
import { prisma } from "@astraya/db";
import type { CertificatePayload } from "@astraya/shared";

/**
 * GET /api/cert/[code]
 *
 * ERC-721 tokenURI target for Astraya certificates. Every minted NFT points
 * its tokenURI here, so marketplaces (OpenSea, Rainbow, BaseScan) will fetch
 * this JSON and render the metadata.
 *
 * The payload schema follows the OpenSea "metadata standard":
 *   - name, description, image, external_url
 *   - attributes: [{ trait_type, value, display_type? }]
 *
 * We keep the original canonical Astraya payload under `astraya` so /verify
 * can still compare the on-chain integrityHash with its source of truth
 * without reparsing the metadata.
 */

function siteUrl(req: Request): string {
  const envUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  if (envUrl) return envUrl.replace(/\/$/, "");
  return new URL(req.url).origin;
}

export async function GET(
  req: Request,
  { params }: { params: { code: string } },
) {
  const cert = await prisma.certificate.findUnique({
    where: { code: params.code },
    include: {
      item: { include: { product: true } },
      consultation: { include: { master: true } },
    },
  });

  if (!cert) {
    return NextResponse.json(
      { error: "certificate not found" },
      { status: 404 },
    );
  }

  let payload: CertificatePayload;
  try {
    payload = JSON.parse(cert.payload) as CertificatePayload;
  } catch {
    return NextResponse.json(
      { error: "certificate payload is not valid JSON" },
      { status: 500 },
    );
  }

  const base = siteUrl(req);
  const isConsultation = cert.kind === "consultation";

  const name = isConsultation
    ? `Astraya Divination · ${payload.product}`
    : `Astraya Certificate · ${payload.product}`;

  const description = isConsultation
    ? `${payload.blessedBy ?? ""} 于 ${payload.issuedAt} 出具的卦象解读，由 Astraya 星脉签名归档。`
    : `${payload.product}（${payload.productEn}）· 来自 ${payload.origin}，Astraya 星脉水晶。`;

  const externalUrl = isConsultation && cert.consultationId
    ? `${base}/my/consultations/${cert.consultationId}`
    : `${base}/verify?nfc=${encodeURIComponent(payload.nfcUid || cert.code)}`;

  const attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }> = [
    { trait_type: "Brand", value: payload.brand },
    { trait_type: "Kind", value: isConsultation ? "divination" : "product" },
    { trait_type: "Origin", value: payload.origin },
    { trait_type: "Element", value: payload.element },
    { trait_type: "Chakra", value: payload.chakra },
    { trait_type: "Serial", value: payload.serialNo },
    { trait_type: "Order", value: payload.orderCode },
  ];
  if (payload.weightGrams) {
    attributes.push({
      trait_type: "Weight (g)",
      value: payload.weightGrams,
      display_type: "number",
    });
  }
  if (payload.blessedBy) {
    attributes.push({ trait_type: "Blessed By", value: payload.blessedBy });
  }

  const body = {
    name,
    description,
    external_url: externalUrl,
    image: `${base}/astraya-seal.svg`,
    attributes,
    astraya: {
      code: cert.code,
      kind: cert.kind,
      integrityHash: cert.integrityHash,
      signature: cert.signature,
      tokenId: cert.tokenId,
      txHash: cert.txHash,
      chainId: cert.chainId,
      contractAddress: cert.contractAddress,
      mintedAt: cert.mintedAt,
      issuedAt: payload.issuedAt,
      payload,
    },
  };

  return NextResponse.json(body, {
    headers: {
      // ERC-721 metadata is safe to cache at the edge for short periods — it
      // only changes when the cert is minted (tokenId/txHash populated).
      "Cache-Control": "public, max-age=60, s-maxage=300",
    },
  });
}
