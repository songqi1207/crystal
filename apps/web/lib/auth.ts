import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@astraya/db";

export const SESSION_COOKIE = "astraya_session";
export const SESSION_TTL_SEC = 30 * 24 * 60 * 60;
export const EMAIL_CODE_TTL_SEC = 10 * 60;

export type AppRole = "user" | "master" | "super_admin";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: AppRole;
  walletAddress: string | null;
  mfaEnabled: boolean;
  mfaVerified: boolean;
}

export function authSecret(): string {
  const configured = (process.env.ASTRAYA_AUTH_SECRET ?? "").trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("ASTRAYA_AUTH_SECRET must be configured in production");
  }
  return "astraya-dev-auth-secret-change-me";
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function hashLoginCode(email: string, code: string): string {
  return crypto
    .createHmac("sha256", authSecret())
    .update(`${normalizeEmail(email)}:${code}`)
    .digest("hex");
}

export function safeHashEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export function newSessionToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString("base64url");
  return {
    token,
    tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
  };
}

function tokenHash(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function asRole(value: string): AppRole {
  if (value === "master") return "master";
  if (value === "super_admin" || value === "admin") return "super_admin";
  return "user";
}

export async function getCurrentSession(): Promise<{
  sessionId: string;
  user: AuthUser;
} | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.userSession.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { user: true },
  });
  if (
    !session ||
    session.revokedAt ||
    session.expiresAt.getTime() <= Date.now() ||
    !session.user.email
  ) {
    return null;
  }

  return {
    sessionId: session.id,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: asRole(session.user.role),
      walletAddress: session.user.walletAddress,
      mfaEnabled: Boolean(session.user.mfaEnabledAt),
      mfaVerified: Boolean(session.mfaVerifiedAt),
    },
  };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  return (await getCurrentSession())?.user ?? null;
}

export function hasRole(user: AuthUser, required: AppRole): boolean {
  const rank: Record<AppRole, number> = {
    user: 1,
    master: 2,
    super_admin: 3,
  };
  return rank[user.role] >= rank[required];
}

export function sessionCookieOptions(maxAge = SESSION_TTL_SEC) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
