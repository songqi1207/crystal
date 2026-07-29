import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@astraya/db";
import {
  SHIPPING_FEE_CENTS,
  ORDER_CODE_PREFIX,
  type CertificatePayload,
} from "@astraya/shared";
import { sha256Hex } from "@astraya/shared/hash";
import { buildCertificate } from "@/lib/certificates";
import { getCurrentUser } from "@/lib/auth";

const shippingAddressSchema = z.object({
  recipient: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(5).max(30),
  countryCode: z.string().trim().regex(/^[A-Z]{2}$/),
  country: z.string().trim().min(1).max(100),
  province: z.string().trim().max(100),
  city: z.string().trim().min(1).max(100),
  district: z.string().trim().max(100),
  addressLine: z.string().trim().min(3).max(500),
  postalCode: z.string().trim().max(30),
});

const createOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,
  items: z
    .array(z.object({ slug: z.string().min(1), quantity: z.number().int().positive().max(20) }))
    .min(1)
    .max(20),
});

function addressSnapshot(address: z.infer<typeof shippingAddressSchema>): string {
  const region = [address.country, address.province, address.city, address.district]
    .filter(Boolean)
    .join(" ");
  return [
    `${address.recipient} · ${address.phone}`,
    region,
    address.addressLine,
    address.postalCode ? `邮编 ${address.postalCode}` : "",
  ].filter(Boolean).join("\n");
}

function genCode() {
  // e.g. ASTR-20260422-AB12
  const now = new Date();
  const ymd = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${ORDER_CODE_PREFIX}-${ymd}-${suffix}`;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 50,
  });
  return NextResponse.json({
    items: orders.map((o) => ({
      code: o.code,
      status: o.status,
      createdAt: o.createdAt,
      itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
      totalCents: o.totalCents,
    })),
  });
}

export async function POST(req: Request) {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  const { shippingAddress, items } = parsed.data;
  const email = authUser.email;

  const products = await prisma.product.findMany({
    where: { slug: { in: items.map((i) => i.slug) }, published: true },
    include: {
      items: {
        where: { status: "in_stock" },
        include: { blessedByMaster: true },
        orderBy: { serialNo: "asc" },
      },
    },
  });

  if (products.length !== new Set(items.map((i) => i.slug)).size) {
    return NextResponse.json({ error: "some products are unavailable" }, { status: 400 });
  }

  let subtotal = 0;
  const plan: Array<{
    productId: string;
    product: (typeof products)[number];
    itemId: string | null;
    quantity: number;
    unitPriceCents: number;
  }> = [];

  for (const line of items) {
    const product = products.find((p) => p.slug === line.slug)!;
    // Try to allocate real stock items; if not enough, fall back to virtual (stockless) line.
    const allocatable = product.items.splice(0, line.quantity);
    subtotal += product.priceCents * line.quantity;
    if (allocatable.length === line.quantity) {
      for (const it of allocatable) {
        plan.push({
          productId: product.id,
          product,
          itemId: it.id,
          quantity: 1,
          unitPriceCents: product.priceCents,
        });
      }
    } else {
      plan.push({
        productId: product.id,
        product,
        itemId: null,
        quantity: line.quantity,
        unitPriceCents: product.priceCents,
      });
    }
  }

  const shippingCents = SHIPPING_FEE_CENTS;
  const total = subtotal + shippingCents;
  const code = genCode();

  const order = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: authUser.id } });

    await tx.address.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });
    await tx.address.create({
      data: {
        userId: user.id,
        recipient: shippingAddress.recipient,
        phone: shippingAddress.phone,
        country: shippingAddress.country,
        province: shippingAddress.province,
        city: shippingAddress.city,
        district: shippingAddress.district || null,
        addressLine: shippingAddress.addressLine,
        postalCode: shippingAddress.postalCode || null,
        isDefault: true,
      },
    });

    const created = await tx.order.create({
      data: {
        code,
        userId: user.id,
        email,
        shippingAddress: addressSnapshot(shippingAddress),
        subtotalCents: subtotal,
        shippingCents,
        totalCents: total,
        currency: "USD",
        status: "paid", // Phase 1: mock payment auto-succeeds
        paymentMethod: "mock",
        paymentStatus: "succeeded",
        items: {
          create: plan.map((p) => ({
            productId: p.productId,
            itemId: p.itemId,
            quantity: p.quantity,
            unitPriceCents: p.unitPriceCents,
          })),
        },
      },
      include: {
        items: { include: { product: true, item: { include: { blessedByMaster: true } } } },
      },
    });

    // Mark allocated ProductItems as sold, generate certificates.
    for (const li of created.items) {
      if (li.item) {
        await tx.productItem.update({
          where: { id: li.item.id },
          data: { status: "sold" },
        });

        const payload: CertificatePayload = {
          brand: "Astraya · 星脉",
          product: li.product.name,
          productEn: li.product.nameEn,
          origin: li.product.origin,
          element: li.product.element,
          chakra: li.product.chakra,
          weightGrams: li.product.weightGrams,
          serialNo: li.item.serialNo,
          nfcUid: li.item.nfcUid,
          nfcHash: li.item.nfcHash,
          blessedBy: li.item.blessedByMaster?.displayName ?? null,
          blessedAt: li.item.blessedAt?.toISOString() ?? null,
          orderCode: created.code,
          issuedAt: new Date().toISOString(),
        };
        const { canonical, integrityHash, signature } = buildCertificate(payload);
        await tx.certificate.create({
          data: {
            kind: "product",
            code: li.item.serialNo,
            userId: user.id,
            orderItemId: li.id,
            itemId: li.item.id,
            payload: canonical,
            integrityHash,
            signature,
            pdfUrl: null,
          },
        });
        // Bind NFC hash to owner (ownership handshake) — future NFC tap
        // verifies: sha256Hex(`${nfcUid}:${ownerUserId}:${integrityHash}`).
        await tx.productItem.update({
          where: { id: li.item.id },
          data: { nfcHash: sha256Hex(`${li.item.nfcUid}:${user.id}:${integrityHash}`) },
        });
      } else {
        // Stockless line: decrement "virtual" stock. Physical piece + cert will
        // be emitted once the operations team restocks and binds an NFC chip.
        await tx.product.update({
          where: { id: li.productId },
          data: { stock: { decrement: li.quantity } },
        });
      }
    }

    return created;
  });

  return NextResponse.json({ code: order.code });
}
