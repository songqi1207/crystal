"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Mail, ShieldCheck } from "lucide-react";

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/my";
  return value;
}

export function LoginForm() {
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/email/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(emailRequestError(body.error));
      setDebugCode(body.debugCode ?? null);
      setStep("code");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "验证码无效");
      const next = safeNext(search.get("next"));
      if (body.mfaSetupRequired) {
        window.location.href = `/mfa/setup?next=${encodeURIComponent(next)}`;
      } else if (body.mfaRequired) {
        window.location.href = `/mfa/verify?next=${encodeURIComponent(next)}`;
      } else {
        window.location.href = next;
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="glass mx-auto max-w-md p-8">
      <div className="text-xs tracking-[0.3em] text-starlight-500">ACCOUNT · 星脉账户</div>
      <h1 className="mt-3 text-3xl">邮箱验证码登录</h1>
      <p className="mt-3 text-sm leading-relaxed text-pearl-400">
        登录后才能查看订单、私人咨询和证书。钱包可在账户内另行绑定。
      </p>

      {step === "email" ? (
        <form onSubmit={requestCode} className="mt-8 space-y-4">
          <label className="block text-xs tracking-[0.2em] text-pearl-400">EMAIL</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="input"
          />
          <button disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            获取验证码
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="mt-8 space-y-4">
          <div className="text-sm text-pearl-300">验证码已发送至 {email}</div>
          {debugCode && (
            <div className="rounded-lg border border-amethyst-400/30 bg-amethyst-500/10 p-3 text-sm text-amethyst-200">
              开发环境验证码：<span className="font-mono text-lg">{debugCode}</span>
            </div>
          )}
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            placeholder="6 位验证码"
            className="input text-center font-mono text-xl tracking-[0.4em]"
          />
          <button disabled={loading || code.length !== 6} className="btn-primary w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            验证并登录
          </button>
          <button type="button" className="w-full text-sm text-pearl-400 hover:text-pearl-200" onClick={() => setStep("email")}>
            更换邮箱
          </button>
        </form>
      )}

      {error && <div className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

      <style jsx>{`
        .input {
          width: 100%; border-radius: 0.75rem; border: 1px solid rgba(168,165,152,.3);
          background: rgba(10,14,39,.7); padding: .8rem 1rem; color: #f0eee6; outline: none;
        }
        .input:focus { border-color: #e8c37a; box-shadow: 0 0 0 3px rgba(232,195,122,.15); }
      `}</style>
    </section>
  );
}

function emailRequestError(error?: string): string {
  if (error === "email_delivery_failed") return "验证码邮件发送失败，请稍后重试或联系管理员检查邮件服务配置";
  if (error === "too_many_requests") return "请求次数过多，请 10 分钟后再试";
  if (error === "invalid_email") return "请输入有效的邮箱地址";
  return "验证码发送失败";
}
