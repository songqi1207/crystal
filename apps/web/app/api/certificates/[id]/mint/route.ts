import { NextResponse } from "next/server";
import { prisma } from "@astraya/db";
import type { Address } from "viem";
import { getAddress } from "viem";
import { isWeb3Enabled, getAstrayaChain } from "@/lib/web3-chains";
import {
  getMintReadiness,
  mintCertificate,
  MintConfigError,
} from "@/lib/mint";
import { getCurrentUser } from "@/lib/auth";

/**
 * POST /api/certificates/[id]/mint
 *
 * Requires an authenticated session. The Certificate must belong to the
 * current user, who must have a wallet bound via SIWE on /my.
 *
 * Response:
 *   200 { ok: true, tokenId, txHash, contractAddress, chainId, explorerUrl }
 *   4xx { ok: false, error, reason? }
 *
 * The server always does the writing: we use ASTRAYA_MINTER_PRIVATE_KEY to
 * sign the `mint` transaction and send the NFT to the user's bound wallet.
 * The user never sees a mint signature prompt.
 */

function parseCertKind(kind: string): "product" | "consultation" {
  return kind === "consultation" ? "consultation" : "product";
}

function explorerTxUrl(txHash: string): string {
  return `${getAstrayaChain().explorerBaseUrl}/tx/${txHash}`;
}

function absoluteTokenUri(req: Request, code: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim()
    || new URL(req.url).origin;
  return `${base.replace(/\/$/, "")}/api/cert/${encodeURIComponent(code)}`;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (!isWeb3Enabled()) {
    return NextResponse.json(
      { ok: false, error: "Web3 尚未开启（NEXT_PUBLIC_ENABLE_WEB3=false）" },
      { status: 400 },
    );
  }
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const cert = await prisma.certificate.findUnique({
    where: { id: params.id },
    include: { user: true },
  });
  if (!cert) {
    return NextResponse.json(
      { ok: false, error: "找不到该证书" },
      { status: 404 },
    );
  }

  if (!cert.user || cert.userId !== authUser.id) {
    return NextResponse.json(
      { ok: false, error: "当前邮箱与证书归属不一致" },
      { status: 403 },
    );
  }

  if (!cert.user.walletAddress) {
    return NextResponse.json(
      {
        ok: false,
        reason: "no_wallet_bound",
        error: "尚未绑定钱包。请先到 /my 通过 SIWE 绑定一个钱包再铸造。",
      },
      { status: 409 },
    );
  }

  if (cert.tokenId) {
    return NextResponse.json(
      {
        ok: false,
        reason: "already_minted",
        error: `该证书已铸造 tokenId #${cert.tokenId}`,
        tokenId: cert.tokenId,
        txHash: cert.txHash,
        contractAddress: cert.contractAddress,
        chainId: cert.chainId,
        explorerUrl: cert.txHash ? explorerTxUrl(cert.txHash) : null,
      },
      { status: 409 },
    );
  }

  const kind = parseCertKind(cert.kind);

  const readiness = getMintReadiness(kind);
  if (!readiness.ready) {
    return NextResponse.json(
      { ok: false, reason: readiness.reason, error: readiness.message },
      { status: 503 },
    );
  }

  let recipient: Address;
  try {
    recipient = getAddress(cert.user.walletAddress);
  } catch {
    return NextResponse.json(
      { ok: false, error: "钱包地址无效，请重新绑定" },
      { status: 400 },
    );
  }

  const tokenUri = absoluteTokenUri(req, cert.code);

  try {
    const result = await mintCertificate({
      kind,
      to: recipient,
      integrityHash: cert.integrityHash,
      tokenUri,
    });

    const updated = await prisma.certificate.update({
      where: { id: cert.id },
      data: {
        tokenId: result.tokenId,
        txHash: result.txHash,
        contractAddress: result.contractAddress,
        chainId: result.chainId,
        mintedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      tokenId: updated.tokenId,
      txHash: updated.txHash,
      contractAddress: updated.contractAddress,
      chainId: updated.chainId,
      mintedAt: updated.mintedAt,
      explorerUrl: updated.txHash ? explorerTxUrl(updated.txHash) : null,
    });
  } catch (err) {
    if (err instanceof MintConfigError) {
      const status = err.reason === "already_minted" ? 409 : 503;
      return NextResponse.json(
        { ok: false, reason: err.reason, error: err.message },
        { status },
      );
    }
    const message = (err as Error)?.message ?? "mint failed";
    console.error("[/api/certificates/:id/mint]", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
