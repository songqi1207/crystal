import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { MfaVerifyForm } from "./verify-form";

export const dynamic = "force-dynamic";

export default async function MfaVerifyPage({ searchParams }: { searchParams: { next?: string } }) {
  const session = await getCurrentSession();
  const next = safeNext(searchParams.next);
  if (!session) redirect(`/login?next=${encodeURIComponent(`/mfa/verify?next=${next}`)}`);
  if (session.user.role !== "super_admin") redirect("/my");
  if (!session.user.mfaEnabled) redirect(`/mfa/setup?next=${encodeURIComponent(next)}`);
  if (session.user.mfaVerified) redirect(next);
  return <div className="container-astra py-16"><MfaVerifyForm next={next} /></div>;
}

function safeNext(value?: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/console";
  return value;
}
