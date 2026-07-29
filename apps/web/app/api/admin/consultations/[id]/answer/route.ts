import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@astraya/db";
import type { CertificatePayload } from "@astraya/shared";
import { buildCertificate } from "@/lib/certificates";
import { getCurrentSession, hasRole } from "@/lib/auth";

/**
 * Answer endpoint for the operations console. A master may answer only their
 * own assigned consultation; a super administrator may answer any.
 */

const schema = z.object({
  answer: z.string().min(20).max(5000),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const authUser = session.user;
  if (!hasRole(authUser, "master")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (authUser.role === "super_admin" && !authUser.mfaVerified) {
    return NextResponse.json({ error: "mfa_required" }, { status: 403 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid payload" }, { status: 400 });

  const c = await prisma.consultation.findUnique({
    where: { id: params.id },
    include: { master: true, user: true },
  });
  if (!c) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!hasRole(authUser, "super_admin") && c.master.userId !== authUser.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
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
