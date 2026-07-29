"use client";

import { useState } from "react";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";

export function MfaSetupForm({ next }: { next: string }) {
  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function begin() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/mfa/setup", { method: "POST" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(messageFor(body.error));
      setSecret(body.secret);
      setUri(body.uri);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function enable(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/mfa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(messageFor(body.error));
      window.location.href = next;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="glass mx-auto max-w-xl p-8">
      <div className="text-xs tracking-[0.3em] text-starlight-500">SECURITY · SUPER ADMIN</div>
      <h1 className="mt-3 text-3xl">启用双重验证</h1>
      <p className="mt-3 text-sm leading-relaxed text-pearl-400">
        超级管理员必须使用身份验证器生成的一次性密码。推荐使用 1Password、Google Authenticator 或 Microsoft Authenticator。
      </p>
      {!secret ? (
        <button onClick={begin} disabled={loading} className="btn-primary mt-8 w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          生成验证密钥
        </button>
      ) : (
        <form onSubmit={enable} className="mt-8 space-y-5">
          <div className="rounded-xl border border-amethyst-400/30 bg-amethyst-500/5 p-5">
            <div className="text-xs tracking-[0.2em] text-pearl-400">手动输入密钥</div>
            <div className="mt-2 break-all font-mono text-lg tracking-wider text-starlight-500">{secret}</div>
            <div className="mt-4 text-xs text-pearl-500">若应用支持 URI，也可复制下面的配置：</div>
            <div className="mt-2 break-all font-mono text-xs text-pearl-400">{uri}</div>
          </div>
          <label className="block text-xs tracking-[0.2em] text-pearl-400">输入应用显示的 6 位验证码</label>
          <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="mfa-input" placeholder="000000" />
          <button disabled={loading || code.length !== 6} className="btn-primary w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            验证并启用
          </button>
        </form>
      )}
      {error && <div className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
      <style jsx>{`.mfa-input{width:100%;border-radius:.75rem;border:1px solid rgba(168,165,152,.3);background:rgba(10,14,39,.7);padding:.8rem 1rem;color:#f0eee6;outline:none;text-align:center;font-family:monospace;font-size:1.25rem;letter-spacing:.4em}.mfa-input:focus{border-color:#e8c37a;box-shadow:0 0 0 3px rgba(232,195,122,.15)}`}</style>
    </section>
  );
}

function messageFor(error?: string): string {
  if (error === "invalid_code") return "验证码无效，请等待新验证码后重试";
  if (error === "mfa_already_enabled") return "双重验证已经启用，请重新登录";
  return "无法完成双重验证设置";
}
