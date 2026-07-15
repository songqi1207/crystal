import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __astrayaPrisma: PrismaClient | undefined;
}

/**
 * Walk up from `start` looking for the pnpm workspace root marker.
 * Falls back to `start` if not found (keeps things best-effort).
 */
function findWorkspaceRoot(start: string): string {
  let dir = start;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (
      fs.existsSync(path.join(dir, "pnpm-workspace.yaml")) ||
      fs.existsSync(path.join(dir, "pnpm-lock.yaml"))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return start;
    dir = parent;
  }
}

/**
 * Build a Prisma SQLite URL from an absolute filesystem path.
 * Prisma on Windows wants `file:C:/forward/slash/path.db` — a bare `file:`
 * prefix followed by a forward-slash path — NOT the WHATWG `file:///C:/...`
 * form returned by `url.pathToFileURL`.
 */
function toPrismaSqliteUrl(absolutePath: string): string {
  return `file:${absolutePath.replace(/\\/g, "/")}`;
}

/**
 * Resolve DATABASE_URL into an absolute `file:` URL so the Prisma engine can
 * open the SQLite file regardless of where the Node process was launched
 * (next dev from `apps/web`, prisma CLI from `packages/db`, etc.).
 * Relative `file:` paths are interpreted against the Prisma schema directory
 * (`<workspaceRoot>/packages/db/prisma`), matching the Prisma CLI semantics.
 */
function resolveDatabaseUrl(): string {
  const workspaceRoot = findWorkspaceRoot(process.cwd());
  const schemaDir = path.join(workspaceRoot, "packages", "db", "prisma");
  const raw = process.env.DATABASE_URL;
  if (!raw) return toPrismaSqliteUrl(path.join(schemaDir, "dev.db"));
  if (!raw.startsWith("file:")) return raw; // postgres/mysql/etc. pass through
  const relative = raw.slice("file:".length);
  if (/^[a-zA-Z]:[\\/]/.test(relative) || relative.startsWith("/")) return raw; // already absolute
  const absolute = path.resolve(schemaDir, relative);
  return toPrismaSqliteUrl(absolute);
}

const databaseUrl = resolveDatabaseUrl();

if (process.env.NODE_ENV !== "production" && !global.__astrayaPrisma) {
  // One-shot diagnostic so we can confirm where Prisma opens the SQLite file.
  console.log(`[astraya/db] DATABASE_URL resolved -> ${databaseUrl}`);
}

export const prisma: PrismaClient =
  global.__astrayaPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    datasources: { db: { url: databaseUrl } },
  });

if (process.env.NODE_ENV !== "production") {
  global.__astrayaPrisma = prisma;
}

export * from "@prisma/client";
