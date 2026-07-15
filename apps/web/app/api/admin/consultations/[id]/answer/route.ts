import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@astraya/db";
import type { CertificatePayload } from "@astraya/shared";
import { buildCertificate } from "@/lib/certificates";

/**
 * Admin endpoint: used by the Astraya operations console (not yet shipped as UI)
 * or by a master to submit their answer. Protected by a shared bearer token
 * defined in `ASTRAYA_ADMIN_TOKEN`.
 */

const schema = z.object({
  answer: z.string().min(20).max(5000),
});

function authorized(req: Request) {
  const expected = process.env.ASTRAYA_ADMIN_TOKEN;
  if (!expected) return false;
  const header = req.headers.get("authorization") || "";
  return header === `Bearer ${expected}`;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid payload" }, { status: 400 });

  const c = await prisma.consultation.findUnique({
    where: { id: params.id },
    include: { master: true, user: true },
  });
  if (!c) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (c.status !== "pending") {
    return NextResponse.json({ error: "already answered" }, { status: 409 });
  }

  const answeredAt = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.consultation.update({
      where: { id: c.id },
      data: { status: "answered", answer: parsed.data.answer, answeredAt },
    });

    const serialNo = `DIV-${c.id.slice(0, 8).toUpperCase()}`;
    const payload: CertificatePayload = {
      brand: "Astraya · 星脉",
      product: `${c.topic} · 卦象解读`,
      productEn: `Divination · ${c.topic}`,
      origin: c.master.displayName,
      element: "metal",
      chakra: "thirdeye",
      weightGrams: 0,
      serialNo,
      nfcUid: "",
      nfcHash: "",
      blessedBy: c.master.displayName,
      blessedAt: answeredAt.toISOString(),
      orderCode: c.code,
      issuedAt: answeredAt.toISOString(),
    };
    const { canonical, integrityHash, signature } = buildCertificate(payload);

    await tx.certificate.create({
      data: {
        kind: "consultation",
        code: serialNo,
        userId: c.userId,
        consultationId: c.id,
        payload: canonical,
        integrityHash,
        signature,
      },
    });

    await tx.master.update({
      where: { id: c.masterId },
      data: { answeredCount: { increment: 1 } },
    });

    return updated;
  });

  return NextResponse.json({ ok: true, consultationId: result.id });
}
