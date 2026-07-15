// Astraya platform constants (shared between web, admin, future indexer)

export const BRAND = {
  nameZh: "星脉",
  nameEn: "Astraya",
  tagline: {
    zh: "星辰脉络中，万物有灵。",
    en: "Where the meridians of stars give voice to the world.",
  },
  domains: {
    sea: "astraya.io",
    cn: "astraya.cn",
  },
} as const;

// Revenue splits (see plan §12)
export const MASTER_REVENUE_SPLIT = {
  master: 0.75,
  platform: 0.2,
  reserve: 0.05,
} as const;

export const NFT_ROYALTY_BPS = {
  total: 500, // 5%
  master: 300,
  platform: 200,
} as const;

// Crystal chakras with bilingual labels and accent colors for UI.
export const CHAKRAS = {
  root: { zh: "海底轮", en: "Root", color: "#B23A48" },
  sacral: { zh: "脐轮", en: "Sacral", color: "#E67E22" },
  solar: { zh: "太阳轮", en: "Solar", color: "#E8C37A" },
  heart: { zh: "心轮", en: "Heart", color: "#5FB3A1" },
  throat: { zh: "喉轮", en: "Throat", color: "#4F9DDE" },
  thirdeye: { zh: "眉心轮", en: "Third Eye", color: "#7B5CC4" },
  crown: { zh: "顶轮", en: "Crown", color: "#C29AE8" },
} as const;

export const ELEMENTS = {
  metal: { zh: "金", en: "Metal" },
  wood: { zh: "木", en: "Wood" },
  water: { zh: "水", en: "Water" },
  fire: { zh: "火", en: "Fire" },
  earth: { zh: "土", en: "Earth" },
} as const;

export const CATEGORIES = {
  raw: { zh: "原石", en: "Raw" },
  polished: { zh: "抛光", en: "Polished" },
  bracelet: { zh: "手链", en: "Bracelet" },
  pendant: { zh: "吊坠", en: "Pendant" },
  tower: { zh: "水晶柱", en: "Tower" },
  geode: { zh: "晶洞", en: "Geode" },
} as const;

export const ORDER_STATUS = {
  pending: { zh: "待支付", en: "Pending" },
  paid: { zh: "已支付", en: "Paid" },
  shipped: { zh: "已发货", en: "Shipped" },
  delivered: { zh: "已送达", en: "Delivered" },
  cancelled: { zh: "已取消", en: "Cancelled" },
  refunded: { zh: "已退款", en: "Refunded" },
} as const;

export const CONSULTATION_STATUS = {
  pending: { zh: "待支付", en: "Pending" },
  paid: { zh: "待大师回复", en: "Awaiting reply" },
  answered: { zh: "已回复", en: "Answered" },
  refunded: { zh: "已退款", en: "Refunded" },
  expired: { zh: "已超时", en: "Expired" },
} as const;

export type ChakraKey = keyof typeof CHAKRAS;
export type ElementKey = keyof typeof ELEMENTS;
export type CategoryKey = keyof typeof CATEGORIES;
export type OrderStatusKey = keyof typeof ORDER_STATUS;
export type ConsultationStatusKey = keyof typeof CONSULTATION_STATUS;

// ---------------------------------------------------------------------------
// Consultation topics (bilingual) — aligned with Consultation.topic column.
// ---------------------------------------------------------------------------
export const DIVINATION_TOPICS = [
  { key: "career", zh: "事业方向", en: "Career" },
  { key: "love", zh: "感情关系", en: "Love" },
  { key: "wealth", zh: "财富丰盛", en: "Wealth" },
  { key: "health", zh: "身心健康", en: "Health" },
  { key: "study", zh: "求学考运", en: "Study" },
  { key: "timing", zh: "时机抉择", en: "Timing" },
] as const;

export type DivinationTopicKey = (typeof DIVINATION_TOPICS)[number]["key"];

// ---------------------------------------------------------------------------
// Pricing / ordering
// ---------------------------------------------------------------------------
// Flat shipping fee applied to Phase 1 USD orders (USD cents).
export const SHIPPING_FEE_CENTS = 2000;

// Prefix used when generating human-friendly order codes (ASTR-YYYYMMDD-XXXX).
export const ORDER_CODE_PREFIX = "ASTR";

// Prefix used when generating human-friendly consultation codes.
export const CONSULTATION_CODE_PREFIX = "ASK";
