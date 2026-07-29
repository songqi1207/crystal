import Link from "next/link";
import { redirect } from "next/navigation";
import { Gem, MessageCircle, ArrowRight } from "lucide-react";
import { prisma } from "@astraya/db";
import { getCurrentUser } from "@/lib/auth";
import { WalletBindSection } from "@/components/web3/WalletBindSection";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/my");

  const [orders, consults] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { items: true },
      take: 50,
    }),
    prisma.consultation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { master: true },
      take: 50,
    }),
  ]);

  return (
    <div className="container-astra py-16">
      <div className="max-w-3xl">
        <div className="text-xs tracking-[0.3em] text-starlight-500">MY ALTAR · 我的法器</div>
        <h1 className="mt-3">收集你的水晶与卦象</h1>
        <p className="mt-3 text-pearl-300">
          当前登录账户：<span className="text-starlight-500">{user.email}</span>。订单、咨询与证书只对这个已验证账户开放。
        </p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <section>
          <div className="flex items-center gap-2 text-xs tracking-[0.3em] text-starlight-500">
            <Gem className="h-3.5 w-3.5" /> 水晶订单
          </div>
          <h2 className="mt-3">我的水晶</h2>
          <div className="mt-6 space-y-3">
            {orders.length === 0 && (
              <div className="glass p-6 text-sm text-pearl-400">
                还没有订单 · <Link href="/products" className="text-starlight-500 hover:underline">去挑一颗 →</Link>
              </div>
            )}
            {orders.map((order) => (
              <Link key={order.code} href={`/my/orders/${order.code}`} className="glass flex items-center justify-between p-5 hover:shadow-glow">
                <div>
                  <div className="font-mono text-sm text-pearl-200">{order.code}</div>
                  <div className="mt-1 text-xs text-pearl-400">
                    {new Date(order.createdAt).toLocaleString()} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} 件
                  </div>
                </div>
                <span className="chip border-starlight-500/40 text-starlight-500">{order.status}</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 text-xs tracking-[0.3em] text-amethyst-400">
            <MessageCircle className="h-3.5 w-3.5" /> 大师卦象
          </div>
          <h2 className="mt-3">我的解惑</h2>
          <div className="mt-6 space-y-3">
            {consults.length === 0 && (
              <div className="glass p-6 text-sm text-pearl-400">
                还没有解惑 · <Link href="/consult" className="text-amethyst-300 hover:underline">去提问 →</Link>
              </div>
            )}
            {consults.map((consultation) => (
              <Link key={consultation.id} href={`/my/consultations/${consultation.id}`} className="glass flex items-center justify-between p-5 hover:shadow-glow-amethyst">
                <div>
                  <div className="text-pearl-100">{consultation.topic} · 问 {consultation.master.displayName}</div>
                  <div className="mt-1 text-xs text-pearl-400">{new Date(consultation.createdAt).toLocaleString()}</div>
                </div>
                <span className="chip border-amethyst-400/40 text-amethyst-300">{consultation.status}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-12"><WalletBindSection /></div>

      {user.role !== "user" && (
        <Link href="/console" className="mt-8 inline-flex items-center gap-2 text-sm text-starlight-500 hover:underline">
          进入{user.role === "super_admin" ? "运营管理台" : "大师工作台"} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
