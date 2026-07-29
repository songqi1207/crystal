import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, ShieldCheck, Users, Gem } from "lucide-react";
import { prisma } from "@astraya/db";
import { getCurrentSession, hasRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ConsolePage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/console");
  const user = session.user;
  if (!hasRole(user, "master")) redirect("/my");
  if (user.role === "super_admin" && !user.mfaEnabled) redirect("/mfa/setup?next=/console");
  if (user.role === "super_admin" && !user.mfaVerified) redirect("/mfa/verify?next=/console");

  if (hasRole(user, "super_admin")) {
    const [users, masters, pendingCount, pendingConsultations, orders] = await Promise.all([
      prisma.user.count(),
      prisma.master.count(),
      prisma.consultation.count({ where: { status: "pending" } }),
      prisma.consultation.findMany({
        where: { status: "pending" },
        orderBy: { createdAt: "asc" },
        take: 20,
        include: { master: { select: { displayName: true } } },
      }),
      prisma.order.count(),
    ]);
    return (
      <ConsoleShell title="运营管理台" subtitle={`超级管理员 · ${user.email}`}>
        <div className="grid gap-4 md:grid-cols-4">
          <Metric icon={<Users className="h-4 w-4" />} label="用户" value={users} />
          <Metric icon={<ShieldCheck className="h-4 w-4" />} label="大师" value={masters} />
          <Metric icon={<ClipboardList className="h-4 w-4" />} label="待处理咨询" value={pendingCount} />
          <Metric icon={<Gem className="h-4 w-4" />} label="订单" value={orders} />
        </div>
        <div className="mt-8 glass p-6">
          <div className="text-xs tracking-[0.3em] text-amethyst-300">待处理咨询</div>
          <div className="mt-4 space-y-3">
            {pendingConsultations.length === 0 && <p className="text-sm text-pearl-400">当前没有待处理咨询。</p>}
            {pendingConsultations.map((consultation) => (
              <Link key={consultation.id} href={`/console/consultations/${consultation.id}`} className="block rounded-lg border border-pearl-700/30 p-4 transition hover:border-amethyst-400/50 hover:bg-amethyst-500/5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-pearl-100">{consultation.topic} · {consultation.master.displayName}</div>
                    <div className="mt-1 text-xs text-pearl-400">{consultation.code} · {new Date(consultation.createdAt).toLocaleString()}</div>
                  </div>
                  <span className="chip border-amethyst-400/40 text-amethyst-300">{consultation.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <p className="mt-8 text-sm text-pearl-400">后续将在此加入大师审核、用户角色、咨询分配、订单和 NFC 管理。</p>
      </ConsoleShell>
    );
  }

  const master = await prisma.master.findUnique({
    where: { userId: user.id },
    include: {
      consultations: {
        where: { status: "pending" },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true } } },
      },
    },
  });
  if (!master) redirect("/my");

  return (
    <ConsoleShell title="大师工作台" subtitle={`${master.displayName} · ${user.email}`}>
      <div className="glass p-6">
        <div className="text-xs tracking-[0.3em] text-amethyst-300">待回复咨询</div>
        <div className="mt-4 space-y-3">
          {master.consultations.length === 0 && <p className="text-sm text-pearl-400">当前没有待回复咨询。</p>}
          {master.consultations.map((consultation) => (
            <Link key={consultation.id} href={`/console/consultations/${consultation.id}`} className="block rounded-lg border border-pearl-700/30 p-4 transition hover:border-amethyst-400/50 hover:bg-amethyst-500/5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-pearl-100">{consultation.topic}</div>
                  <div className="mt-1 text-xs text-pearl-400">{consultation.code} · {new Date(consultation.createdAt).toLocaleString()}</div>
                </div>
                <span className="chip border-amethyst-400/40 text-amethyst-300">{consultation.status}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </ConsoleShell>
  );
}

function ConsoleShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="container-astra py-16">
      <Link href="/my" className="text-sm text-pearl-400 hover:text-starlight-500">← 返回我的法器</Link>
      <div className="mt-8">
        <div className="text-xs tracking-[0.3em] text-starlight-500">CONSOLE · 工作台</div>
        <h1 className="mt-3">{title}</h1>
        <p className="mt-2 text-sm text-pearl-400">{subtitle}</p>
      </div>
      <div className="mt-10">{children}</div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="glass p-5">
      <div className="flex items-center gap-2 text-xs text-pearl-400">{icon}{label}</div>
      <div className="mt-3 font-serif text-3xl text-starlight-500">{value}</div>
    </div>
  );
}
