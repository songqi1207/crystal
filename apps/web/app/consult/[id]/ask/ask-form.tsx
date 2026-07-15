"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { formatMoney, DIVINATION_TOPICS } from "@astraya/shared";

export function AskForm({
  masterId,
  masterName,
  feeCents,
}: {
  masterId: string;
  masterName: string;
  feeCents: number;
}) {
  const router = useRouter();
  const [topic, setTopic] = useState<string>("career");
  const [question, setQuestion] = useState("");
  const [birthInfo, setBirthInfo] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (question.trim().length < 20) {
      setError("请至少用 20 个字描述你的困惑，便于大师更准确解读。");
      return;
    }
    if (!email.includes("@")) {
      setError("请填写正确的邮箱，解答生成后会通过邮件通知。");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          masterId,
          topic,
          question: question.trim(),
          birthInfo: birthInfo.trim() || null,
          email: email.trim(),
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || "提交失败");
      }
      const { id } = (await res.json()) as { id: string };
      router.push(`/my/consultations/${id}`);
    } catch (err: any) {
      setError(err.message || "提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass p-8 space-y-6">
      <div>
        <label className="block text-xs tracking-[0.2em] text-pearl-400 uppercase">问题主题</label>
        <div className="mt-3 flex flex-wrap gap-2">
          {DIVINATION_TOPICS.map((t) => (
            <button
              type="button"
              key={t.key}
              onClick={() => setTopic(t.key)}
              className={
                topic === t.key
                  ? "chip bg-amethyst-500/20 border-amethyst-400 text-amethyst-300"
                  : "chip hover:border-amethyst-400/60"
              }
            >
              {t.zh} · {t.en}
            </button>
          ))}
        </div>
      </div>

      <Field label="生辰 / 关键时间（可选）">
        <input
          value={birthInfo}
          onChange={(e) => setBirthInfo(e.target.value)}
          placeholder="如：阳历 1993-03-15 22:10，香港"
          className="input"
        />
      </Field>

      <Field label="详细描述你的困惑">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={6}
          placeholder="请尽量完整地描述你的处境、你希望大师回应的方向…"
          className="input min-h-[160px] font-sans leading-relaxed"
        />
        <div className="mt-2 text-right text-xs text-pearl-400">{question.length} / 2000</div>
      </Field>

      <Field label="接收解答的邮箱">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="input"
        />
      </Field>

      {error && (
        <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex items-end justify-between pt-2">
        <div>
          <div className="text-xs text-pearl-400">应付解惑费</div>
          <div className="font-serif text-2xl text-starlight-500">
            {formatMoney(feeCents, { currency: "USD", locale: "en" })}
          </div>
        </div>
        <button type="submit" disabled={submitting} className="btn-amethyst">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          确认提交给 {masterName}
        </button>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(168, 165, 152, 0.25);
          background: rgba(10, 14, 39, 0.6);
          padding: 0.75rem 1rem;
          color: #f0eee6;
          outline: none;
          transition: border-color 0.2s;
        }
        .input:focus {
          border-color: #9d6fd9;
          box-shadow: 0 0 0 3px rgba(157, 111, 217, 0.15);
        }
        .input::placeholder {
          color: rgba(168, 165, 152, 0.55);
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs tracking-[0.2em] text-pearl-400 uppercase">{label}</label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
