import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { MfaSetupForm } from "./setup-form";

export const dynamic = "force-dynamic";

export default async function MfaSetupPage({ searchParams }: { searchParams: { next?: string } }) {
  const session = await getCurrentSession();
  const next = safeNext(searchParams.next);
  if (!session) redirect(`/login?next=${encodeURIComponent(`/mfa/setup?next=${next}`)}`);
  if (session.user.role !== "super_admin") redirect("/my");
  if (session.user.mfaEnabled) {
    redirect(session.user.mfaVerified ? next : `/mfa/verify?next=${encodeURIComponent(next)}`);
  }
  return <div className="container-astra py-16"><MfaSetupForm next={next} /></div>;
}

function safeNext(value?: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/console";
  return value;
}
