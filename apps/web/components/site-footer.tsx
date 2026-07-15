import Link from "next/link";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-night-600/40 bg-night-900/60">
      <div className="container-astra py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1 space-y-4">
            <Logo />
            <p className="text-sm text-pearl-400 leading-relaxed">
              星辰脉络中，万物有灵。
              <br />
              Where the meridians of stars give voice to the world.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold tracking-[0.3em] text-starlight-500">
              探索
            </h4>
            <ul className="space-y-2 text-sm text-pearl-300">
              <li><Link href="/products" className="hover:text-starlight-500">水晶臻选</Link></li>
              <li><Link href="/consult" className="hover:text-starlight-500">大师解惑</Link></li>
              <li><Link href="/my" className="hover:text-starlight-500">我的法器</Link></li>
              <li><Link href="/verify" className="hover:text-starlight-500">扫码验真</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold tracking-[0.3em] text-starlight-500">
              关于
            </h4>
            <ul className="space-y-2 text-sm text-pearl-300">
              <li><Link href="/about" className="hover:text-starlight-500">品牌故事</Link></li>
              <li><Link href="/about#roadmap" className="hover:text-starlight-500">链上路线图</Link></li>
              <li><Link href="/about#masters" className="hover:text-starlight-500">加入大师</Link></li>
              <li><Link href="/about#contact" className="hover:text-starlight-500">联系我们</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold tracking-[0.3em] text-starlight-500">
              合规
            </h4>
            <ul className="space-y-2 text-sm text-pearl-300">
              <li><Link href="/legal/terms" className="hover:text-starlight-500">服务条款</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-starlight-500">隐私政策</Link></li>
              <li><Link href="/legal/shipping" className="hover:text-starlight-500">物流与退换</Link></li>
              <li className="text-pearl-400 text-xs mt-4">© {new Date().getFullYear()} Astraya Limited. HK.</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 hair-line" />
        <p className="mt-6 text-xs text-pearl-400 leading-relaxed max-w-3xl">
          免责声明：Astraya 提供的水晶产品与大师解惑服务属于文化与精神咨询范畴，不替代医疗、法律或金融建议。
          大师回复基于经验与传统典籍，结果仅供参考。
        </p>
      </div>
    </footer>
  );
}
