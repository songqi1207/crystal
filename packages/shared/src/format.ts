// Currency and helper formatters (locale-aware for zh / en).

export type Locale = "zh" | "en";

const FORMATTERS: Record<string, Intl.NumberFormat> = {};

function moneyFormatter(locale: Locale, currency: string): Intl.NumberFormat {
  const key = `${locale}-${currency}`;
  if (!FORMATTERS[key]) {
    FORMATTERS[key] = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    });
  }
  return FORMATTERS[key]!;
}

export function formatMoney(
  cents: number,
  opts?: { locale?: Locale; currency?: "USD" | "CNY" | "SGD" | "HKD" }
): string {
  const locale = opts?.locale ?? "zh";
  const currency = opts?.currency ?? (locale === "zh" ? "CNY" : "USD");
  return moneyFormatter(locale, currency).format(cents / 100);
}

export function formatDateTime(value: Date | string, locale: Locale = "zh"): string {
  const d = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function truncateHash(hash: string, head = 6, tail = 4): string {
  if (hash.length <= head + tail + 1) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

/** Convert a centavo amount in USD to RMB centavos using a placeholder rate. */
export const USD_TO_CNY_RATE_FALLBACK = 7.2;

export function usdCentsToCnyCents(usd: number, rate = USD_TO_CNY_RATE_FALLBACK): number {
  return Math.round(usd * rate);
}
