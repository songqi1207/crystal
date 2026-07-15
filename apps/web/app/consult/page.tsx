import { prisma } from "@astraya/db";
import { MasterCard, type MasterCardData } from "@/components/master-card";

export const revalidate = 60;

export default async function ConsultPage() {
  const masters = await prisma.master.findMany({
    where: { published: true },
    orderBy: [{ rating: "desc" }, { answeredCount: "desc" }],
  });

  const data: MasterCardData[] = masters.map((m) => ({
    id: m.id,
    displayName: m.displayName,
    title: m.title,
    bio: m.bio,
    specialties: m.specialties,
    baseFeeCents: m.baseFeeCents,
    responseHours: m.responseHours,
    rating: m.rating,
    answeredCount: m.answeredCount,
  }));

  return (
    <div className="container-astra py-16">
      <div className="max-w-3xl">
        <div className="text-xs tracking-[0.3em] text-starlight-500">大师解惑 · MASTERS</div>
        <h1 className="mt-3">向承传者请教</h1>
        <p className="mt-4 text-pearl-300">
          付费提问，大师 24–72 小时内回复；答复将生成链下 PDF 卦象证书，
          Phase 2 上线后可一键回铸为 Base 链上 ERC-721 卦象 NFT。
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.map((m) => <MasterCard key={m.id} m={m} />)}
      </div>
    </div>
  );
}
