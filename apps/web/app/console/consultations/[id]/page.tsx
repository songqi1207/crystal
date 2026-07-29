import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@astraya/db";
import { getCurrentSession, hasRole } from "@/lib/auth";
import { AnswerForm } from "./answer-form";

export const dynamic = "force-dynamic";

export default async function ConsoleConsultationPage({ params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(`/console/consultations/${params.id}`)}`);
  const user = session.user;
  if (!hasRole(user, "master")) redirect("/my");
  if (user.role === "super_admin" && !user.mfaEnabled) {
    redirect(`/mfa/setup?next=${encodeURIComponent(`/console/consultations/${params.id}`)}`);
  }
  if (user.role === "super_admin" && !user.mfaVerified) {
    redirect(`/mfa/verify?next=${encodeURIComponent(`/console/consultations/${params.id}`)}`);
  }

  const consultation = await prisma.consultation.findUnique({
    where: { id: params.id },
    include: { master: true, user: { select: { name: true } } },
  });
  if (!consultation) notFound();
  if (user.role !== "super_admin" && consultation.master.userId !== user.id) notFound();

  return (
    <div className="container-astra py-16">
      <Link href="/console" className="text-sm text-pearl-400 hover:text-starlight-500">← 返回工作台</Link>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr,360px]">
        <main>
          <div className="text-xs tracking-[0.3em] text-amethyst-300">CONSULTATION · {consultation.code}</div>
          <h1 className="mt-3">{consultation.topic} 咨询</h1>
          <div className="mt-8 glass p-7">
            <div className="text-xs tracking-[0.2em] text-pearl-400">用户问题</div>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-pearl-100">{consultation.question}</p>
            {consultation.birthInfo && (
              <div className="mt-5 rounded-lg border border-pearl-700/30 p-4 text-sm text-pearl-300">
                出生／关键时间：{consultation.birthInfo}
              </div>
            )}
          </div>
          {consultation.status === "pending" ? (
            <AnswerForm consultationId={consultation.id} />
          ) : (
            <div className="mt-6 glass p-7">
              <div className="text-xs tracking-[0.2em] text-starlight-500">已回复</div>
              <p className="mt-4 whitespace-pre-line leading-relaxed text-pearl-200">{consultation.answer}</p>
            </div>
          )}
        </main>
        <aside className="glass h-max p-6 text-sm">
          <div className="text-xs tracking-[0.2em] text-starlight-500">处理信息</div>
          <dl className="mt-5 space-y-3">
            <Row label="状态" value={consultation.status} />
            <Row label="大师" value={consultation.master.displayName} />
            <Row label="用户" value={consultation.user.name || "匿名用户"} />
            <Row label="提交时间" value={new Date(consultation.createdAt).toLocaleString()} />
            <Row label="截止时间" value={consultation.deadlineAt ? new Date(consultation.deadlineAt).toLocaleString() : "—"} />
          </dl>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><dt className="text-pearl-400">{label}</dt><dd className="text-right text-pearl-200">{value}</dd></div>;
}
