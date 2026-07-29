"use client";

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

export function MfaVerifyForm({ next }: { next: string }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/mfa/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error === "invalid_code" ? "验证码无效" : "验证失败");
      window.location.href = next;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="glass mx-auto max-w-md p-8">
      <div className="text-xs tracking-[0.3em] text-starlight-500">MFA · SECOND FACTOR</div>
      <h1 className="mt-3 text-3xl">管理员安全验证</h1>
      <p className="mt-3 text-sm text-pearl-400">请输入身份验证器当前显示的 6 位一次性密码。</p>
      <form onSubmit={verify} className="mt-8 space-y-4">
        <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="mfa-input" placeholder="000000" />
        <button disabled={loading || code.length !== 6} className="btn-primary w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          完成验证
        </button>
      </form>
      {error && <div className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
      <style jsx>{`.mfa-input{width:100%;border-radius:.75rem;border:1px solid rgba(168,165,152,.3);background:rgba(10,14,39,.7);padding:.8rem 1rem;color:#f0eee6;outline:none;text-align:center;font-family:monospace;font-size:1.25rem;letter-spacing:.4em}.mfa-input:focus{border-color:#e8c37a;box-shadow:0 0 0 3px rgba(232,195,122,.15)}`}</style>
    </section>
  );
}
