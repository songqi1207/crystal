import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { prisma } from "@astraya/db";
import { CONSULTATION_CODE_PREFIX, DIVINATION_TOPICS } from "@astraya/shared";

const TOPICS = DIVINATION_TOPICS.map((t) => t.key) as [string, ...string[]];

function genConsultationCode(): string {
  const now = new Date();
  const ymd = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
  return `${CONSULTATION_CODE_PREFIX}-${ymd}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

const createConsultationSchema = z.object({
  masterId: z.string().min(1),
  topic: z.enum(TOPICS),
  question: z.string().min(20).max(2000),
  birthInfo: z.string().max(500).nullable().optional(),
  email: z.string().email(),
});

export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email")?.trim();
  if (!email) return NextResponse.json({ items: [] });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ items: [] });
  const list = await prisma.consultation.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { master: true },
    take: 50,
  });
  return NextResponse.json({
    items: list.map((c) => ({
      id: c.id,
      topic: c.topic,
      status: c.status,
      masterName: c.master.displayName,
      createdAt: c.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = createConsultationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  const { masterId, topic, question, birthInfo, email } = parsed.data;

  const master = await prisma.master.findUnique({ where: { id: masterId } });
  if (!master || !master.published) {
    return NextResponse.json({ error: "master unavailable" }, { status: 404 });
  }

  const c = await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    return tx.consultation.create({
      data: {
        code: genConsultationCode(),
        userId: user.id,
        masterId,
        topic,
        question,
        birthInfo: birthInfo ?? null,
        feeCents: master.baseFeeCents,
        currency: "USD",
        status: "pending",
        paymentMethod: "mock",
        paymentStatus: "succeeded", // Phase 1 mock
      },
    });
  });

  return NextResponse.json({ id: c.id });
}
