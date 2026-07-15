"use client";

import { useEffect, useState } from "react";
import { MintCertificateButton, type MintedInfo } from "./MintCertificateButton";

/**
 * Thin client wrapper used on server-rendered detail pages
 * (`/my/orders/[code]`, `/my/consultations/[id]`).
 *
 * Server components can't read localStorage where we stashed the user's
 * email at /my query time, so we hydrate it here and pass it through to
 * the mint button. Keeping this separate from MintCertificateButton lets
 * us keep the button pure / storybook-friendly.
 */
export function MintCertificateBlock({
  certificateId,
  enabled,
  initialMinted,
  compact,
  label,
}: {
  certificateId: string;
  enabled: boolean;
  initialMinted?: MintedInfo | null;
  compact?: boolean;
  label?: string;
}) {
  const [email, setEmail] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setEmail(localStorage.getItem("astraya.my.email") ?? "");
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="text-xs text-pearl-500">正在加载链上状态…</div>
    );
  }

  return (
    <MintCertificateButton
      certificateId={certificateId}
      email={email}
      enabled={enabled}
      initialMinted={initialMinted ?? null}
      compact={compact}
      label={label}
    />
  );
}
