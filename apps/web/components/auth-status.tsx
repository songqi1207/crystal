"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, Sparkles } from "lucide-react";

type SessionUser = { email: string; role: "user" | "master" | "super_admin" };

export function AuthStatus() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => setUser(body?.user ?? null))
      .catch(() => setUser(null));
  }, []);

  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    window.location.href = "/";
  }

  if (!user) {
    return (
      <Link href="/login" className="flex items-center gap-2 rounded-full bg-starlight-500 px-4 py-2 text-sm font-medium text-night-900 hover:bg-starlight-400">
        <Sparkles className="h-4 w-4" />
        <span>登录</span>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={user.role === "user" ? "/my" : "/console"} className="max-w-36 truncate text-xs text-pearl-300 hover:text-starlight-500">
        {user.email}
      </Link>
      <button type="button" onClick={logout} aria-label="退出登录" className="rounded-full border border-night-500/70 p-2 text-pearl-300 hover:border-starlight-500 hover:text-starlight-500">
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
