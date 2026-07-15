import Link from "next/link";
import { Gem, Sparkles, ShieldCheck, Workflow, ArrowRight } from "lucide-react";
import { Starfield } from "@/components/starfield";

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <Starfield />
        <div className="container-astra relative py-24">
          <div className="text-xs tracking-[0.3em] text-starlight-500">ABOUT · 关于星脉</div>
          <h1 className="mt-4 max-w-3xl text-balance">
            让每一颗水晶、每一次问卜，
            都留下可追溯的轨迹。
          </h1>
          <p className="mt-6 max-w-2xl text-pearl-300 leading-relaxed">
            Astraya 是水晶与玄学的 Web3
            化品牌。我们相信：矿脉的能量值得被认真对待，东方玄学的智慧也值得被现代标准保存。
            我们把矿产商、开光大师、用户与链上证书，连成一条"星脉"。
          </p>
        </div>
      </section>

      <section className="container-astra py-20">
        <div className="grid gap-8 md:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="glass p-8">
              <v.icon className="h-6 w-6 text-starlight-500" />
              <h3 className="mt-4 text-xl font-serif text-pearl-100">{v.title}</h3>
              <p className="mt-3 text-sm text-pearl-300 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="roadmap" className="container-astra py-20">
        <div className="text-xs tracking-[0.3em] text-starlight-500">ROADMAP · 路线图</div>
        <h2 className="mt-3">从链下到链上的三步</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {ROADMAP.map((r) => (
            <div key={r.phase} className="glass p-8 relative">
              <div className="absolute top-6 right-6 text-xs tracking-[0.3em] text-starlight-500">
                {r.phase}
              </div>
              <h3 className="font-serif text-xl text-pearl-100">{r.title}</h3>
              <ul className="mt-4 space-y-2 text-sm text-pearl-300">
                {r.items.map((it) => (
                  <li key={it} className="flex gap-2">
                    <span className="text-starlight-500">✦</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section id="masters" className="container-astra py-20">
        <div className="text-xs tracking-[0.3em] text-starlight-500">MASTERS · 加入大师</div>
        <h2 className="mt-3">与承传者并肩</h2>
        <p className="mt-3 max-w-2xl text-pearl-300 leading-relaxed">
          如果你是紫微斗数、塔罗、风水或水晶疗愈的承传者，我们正在招募首批入驻大师。
          Astraya 提供用户来源、身份背书、自动结算与证书体系，
          你只需专注于解读本身。
        </p>
        <div className="mt-6">
          <Link href="mailto:masters@astraya.io" className="btn-amethyst">
            与我们沟通 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section id="contact" className="container-astra py-20">
        <div className="glass p-10 md:p-14">
          <div className="text-xs tracking-[0.3em] text-starlight-500">CONTACT · 联系我们</div>
          <h2 className="mt-3">让我们一起接住每一份能量</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3 text-sm text-pearl-300">
            <div>
              <div className="text-pearl-400 text-xs tracking-[0.3em] mb-1">合作咨询</div>
              <a href="mailto:hello@astraya.io" className="hover:text-starlight-500">hello@astraya.io</a>
            </div>
            <div>
              <div className="text-pearl-400 text-xs tracking-[0.3em] mb-1">大师入驻</div>
              <a href="mailto:masters@astraya.io" className="hover:text-starlight-500">masters@astraya.io</a>
            </div>
            <div>
              <div className="text-pearl-400 text-xs tracking-[0.3em] mb-1">矿产供应</div>
              <a href="mailto:supply@astraya.io" className="hover:text-starlight-500">supply@astraya.io</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

const VALUES = [
  {
    icon: Gem,
    title: "物实可信",
    desc: "每颗水晶都记录矿脉、重量、色泽、颜色谱段，并嵌入 NFC 芯片，扫码即可校验身份。",
  },
  {
    icon: Sparkles,
    title: "文化有根",
    desc: "我们尊重紫微、塔罗、风水、疗愈四大体系，每位入驻大师都经过承传与作品审核。",
  },
  {
    icon: ShieldCheck,
    title: "合规先行",
    desc: "Phase 1 在香港运营电商与内容；Phase 2 通过合规律所与交易所上链 USDC 与 NFT。",
  },
];

const ROADMAP = [
  {
    phase: "PHASE 01",
    title: "链下体验 MVP",
    items: [
      "水晶电商 + 法币支付",
      "大师问卜 + 评价体系",
      "NFC 芯片 + PDF 证书",
      "管理员后台与 CMS",
    ],
  },
  {
    phase: "PHASE 02",
    title: "链上凭证",
    items: [
      "Base 上 ERC-721 证书合约",
      "USDC 支付（EIP-3009 / Permit）",
      "钱包登录 + 证书一键回铸",
      "卦象 NFT：大师 ↔ 用户 soul-bound",
    ],
  },
  {
    phase: "PHASE 03",
    title: "星脉生态",
    items: [
      "矿产供应商 DAO 与分润",
      "水晶即质押：NFT 抵押借贷",
      "大师二级市场与订阅",
      "链上声誉与脉轮指数",
    ],
  },
];
