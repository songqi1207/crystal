"use client";

import { MintCertificateButton, type MintedInfo } from "./MintCertificateButton";

/**
 * Thin client wrapper used on server-rendered detail pages
 * (`/my/orders/[code]`, `/my/consultations/[id]`).
 *
 * The server verifies ownership from the HttpOnly session cookie; this
 * wrapper only keeps the interactive mint state out of the server page.
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
  return (
    <MintCertificateButton
      certificateId={certificateId}
      enabled={enabled}
      initialMinted={initialMinted ?? null}
      compact={compact}
      label={label}
    />
  );
}
