import { NextResponse } from "next/server";
import { prisma } from "@astraya/db";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const p = await prisma.product.findUnique({ where: { slug: params.slug } });
  if (!p || !p.published) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({
    slug: p.slug,
    name: p.name,
    nameEn: p.nameEn,
    priceCents: p.priceCents,
    stock: p.stock,
  });
}
