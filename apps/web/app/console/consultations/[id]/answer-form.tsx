"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";

export function AnswerForm({ consultationId }: { consultationId: string }) {
  const router = useRouter();
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/consultations/${consultationId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (body.error === "mfa_required") window.location.href = `/mfa/verify?next=${encodeURIComponent(`/console/consultations/${consultationId}`)}`;
        throw new Error(errorMessage(body.error));
      }
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 glass p-7">
      <label className="text-xs tracking-[0.2em] text-starlight-500">大师回复</label>
      <textarea
        required
        minLength={20}
        maxLength={5000}
        rows={12}
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder="请输入完整、审慎且可操作的解读（至少 20 个字符）"
        className="mt-4 w-full rounded-xl border border-pearl-700/40 bg-night-900/70 p-4 leading-relaxed text-pearl-100 outline-none focus:border-amethyst-400"
      />
      <div className="mt-3 flex items-center justify-between gap-4">
        <span className="text-xs text-pearl-500">{answer.length} / 5000</span>
        <button disabled={loading || answer.trim().length < 20} className="btn-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          提交回复并签发证书
        </button>
      </div>
      {error && <div className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
    </form>
  );
}

function errorMessage(error?: string): string {
  if (error === "already answered") return "该咨询已经回复";
  if (error === "forbidden") return "你无权处理这条咨询";
  if (error === "invalid payload") return "回复需为 20 至 5000 个字符";
  return "提交失败，请稍后重试";
}
