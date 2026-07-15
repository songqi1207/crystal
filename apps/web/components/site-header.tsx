import Link from "next/link";
import { Sparkles, User, ShoppingBag } from "lucide-react";
import { Logo } from "./logo";

const NAV = [
  { href: "/products", label: "水晶臻选", labelEn: "Crystals" },
  { href: "/consult", label: "大师解惑", labelEn: "Masters" },
  { href: "/my", label: "我的法器", labelEn: "My Altar" },
  { href: "/about", label: "关于星脉", labelEn: "About" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-night-600/40 bg-night-900/70 backdrop-blur-xl">
      <div className="container-astra flex h-18 items-center justify-between py-4">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="group relative text-sm text-pearl-300 hover:text-starlight-500"
            >
              <span className="block">{n.label}</span>
              <span className="block text-[10px] tracking-[0.3em] text-pearl-400 group-hover:text-starlight-500/80">
                {n.labelEn.toUpperCase()}
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            className="flex items-center gap-2 rounded-full border border-night-500/70 bg-night-700/40 px-4 py-2 text-sm text-pearl-200 hover:border-starlight-500 hover:text-starlight-500"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">购物袋</span>
          </Link>
          <Link
            href="/my"
            className="flex items-center gap-2 rounded-full bg-starlight-500 px-4 py-2 text-sm font-medium text-night-900 hover:bg-starlight-400"
          >
            <Sparkles className="h-4 w-4" />
            <span>登录</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
