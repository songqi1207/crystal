import { NextResponse } from "next/server";
import { prisma } from "@astraya/db";
import {
  SESSION_COOKIE,
  getCurrentSession,
  sessionCookieOptions,
} from "@/lib/auth";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, user: session.user });
}

export async function DELETE() {
  const session = await getCurrentSession();
  if (session) {
    await prisma.userSession.update({
      where: { id: session.sessionId },
      data: { revokedAt: new Date() },
    });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return response;
}
