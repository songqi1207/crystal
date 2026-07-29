# Astraya · 星脉

> 星辰脉络中，万物有灵。水晶臻选 · 大师解惑 · 链上溯源。

Astraya 是一个水晶电商 + 玄学咨询 + Web3 溯源的 monorepo 项目。本仓库是 **Phase 1 MVP**：一个可独立运行的 Next.js + Prisma 应用，带内置演示数据、完整的下单/咨询/验真闭环，以及为 Phase 2（上链）预留的可扩展接口。

## 亮点

- **深空黑金** 视觉：Tailwind 自定义调色盘 + 衬线中英文排印，星野背景与紫水晶辅色。
- **三条主线**：`/products` 水晶电商，`/consult` 大师解惑，`/my` 我的法器（订单 + 卦象）。
- **物实绑定**：每件水晶 `CrystalItem` 都含 `nfcUid` + `nfcHash`，下单后自动生成 HMAC 签名的数字证书，扫码即可在 `/verify` 校验。
- **Phase 2 预留**：证书采用 canonical JSON + SHA256 + HMAC 的结构，未来可直接改为 Base 链上 ERC-721 metadata；所有 Prisma 模型已保留 `walletAddress`, `txHash`, `chainId` 字段。
- **Monorepo**：`apps/web` + `packages/db` + `packages/shared` 由 pnpm workspaces 管理。

## 目录结构

```text
crystal/
├── apps/
│   └── web/                    # Next.js 14 App Router
│       ├── app/                # 页面 + API 路由
│       ├── components/         # UI 组件
│       ├── lib/                # 工具 & 证书签名
│       └── .env.example
├── packages/
│   ├── db/                     # Prisma schema + 种子数据
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts
│   ├── shared/                 # 共享常量、类型、格式化工具
│   └── contracts/              # Phase 2 链上合约（Hardhat + OZ v5）
│       ├── contracts/          # Solidity 源码
│       ├── test/               # Hardhat + ethers v6 单测
│       └── scripts/deploy.ts   # Base Sepolia 部署脚本
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## 快速开始

前置：**Node 20+**、**pnpm 9+**。

```bash
# 1. 克隆并安装依赖
pnpm install

# 2. 准备环境与 Prisma（SQLite 演示库，零外部依赖）
cp apps/web/.env.example apps/web/.env
cp packages/db/.env.example packages/db/.env
pnpm db:generate
pnpm db:push
pnpm db:seed

# 3. 启动开发服务器
pnpm dev
# 打开 http://localhost:3000
```

首次进入 `/login`，输入邮箱获取一次性验证码。邮件默认通过 Resend
真实投递；本地需要先按下方“登录验证码邮件”配置密钥。演示账户包括：

- `demo@astraya.dev`：普通用户
- `master.ziwei@astraya.dev`：大师
- `admin@astraya.dev`：超级管理员

超级管理员首次登录会被强制进入 `/mfa/setup`，需在身份验证器中保存 TOTP 密钥并完成一次验证；后续每个新 Session 都必须通过 `/mfa/verify` 才能访问运营台或执行敏感操作。开发环境执行 `pnpm db:seed` 会重置演示管理员及其 MFA。

### 登录验证码邮件

开发和生产环境默认都执行真实邮件投递，不会把验证码返回给浏览器：

1. 在 Resend 创建 API Key。
2. 添加你拥有的域名或邮件子域名，并按控制台提示配置 SPF、DKIM。
3. 在 `apps/web/.env` 配置：

   ```env
   ASTRAYA_EMAIL_MODE="resend"
   RESEND_API_KEY="re_xxxxxxxxx"
   ASTRAYA_EMAIL_FROM="Astraya <login@send.example.com>"
   ```

4. 重启 `pnpm dev` 后再申请验证码。

只有离线调试时才设置 `ASTRAYA_EMAIL_MODE="console"`。该模式会在开发页面显示验证码，并且在生产环境被拒绝。

### 主要脚本

| 脚本 | 说明 |
|---|---|
| `pnpm dev` | 运行 Web 应用（端口 3000） |
| `pnpm build` | 生产构建 |
| `pnpm db:generate` | 生成 Prisma Client |
| `pnpm db:push` | 将 schema 写入 SQLite |
| `pnpm db:seed` | 植入 6 款水晶 + 12 件实体 + 3 位大师 + 1 位管理员的演示数据 |
| `pnpm db:studio` | 打开 Prisma Studio |
| `pnpm contracts:compile` | 编译 Phase 2 Solidity 合约（`packages/contracts`） |
| `pnpm contracts:test` | 跑 Hardhat 单测（纯内存链，无需 RPC） |
| `pnpm contracts:deploy:base-sepolia` | 部署到 Base Sepolia（需 `DEPLOYER_PRIVATE_KEY`） |

## 核心体验流程

1. **逛水晶**：首页 → `/products` → 点开 `紫水晶洞 · 巴西` → 查看可选实体与证书说明。
2. **登录**：`/login` 输入邮箱和一次性验证码，服务器创建 HttpOnly Session。
3. **下单**：`加入购物袋` → `/cart` 填地址 → `确认下单（模拟支付）`。下单成功后，一枚 `CrystalItem` 被锁定为 `sold`，自动生成含 NFC 哈希与 HMAC 签名的 `Certificate`。
4. **查看法器**：`/my` 仅展示当前登录用户的订单、咨询与证书。
5. **向大师问卜**：`/consult` → 选大师 → `/consult/:id/ask` 提交问题。大师登录 `/console` 后处理分配给自己的咨询。
6. **扫码验真**：`/verify` 输入种子数据中的 NFC UID，校验实体是否由 Astraya 官方发行。

## 路线图

| 阶段 | 目标 | 本仓库状态 |
|---|---|---|
| **Phase 1 · MVP** | 水晶电商 + 大师咨询 + PDF/HMAC 证书 + NFC 验真 | ✅ 本仓库实现 |
| **Phase 2 · 链上凭证** | Base ERC-721 证书合约，钱包登录，证书一键回铸，USDC 支付 | 🟡 **M1/M2/M3 完成**：合约 + 单测 + SIWE 钱包绑定 + 证书回铸；M4（USDC）排期中 |
| **Phase 3 · 星脉生态** | 矿产供应 DAO、NFT 抵押借贷、链上声誉、大师订阅 | 规划中 |

### Phase 2 里程碑

- **M1 · 合约 + 单测** ✅ — `AstrayaCertificate721` / `AstrayaDivination721` (OZ v5 ERC-721 + ERC-2981 + AccessControl)，duplicate-hash 防重铸，17 项 Hardhat 测试全绿。详见 [`packages/contracts/README.md`](./packages/contracts/README.md)。
- **M2 · 钱包绑定** ✅ — 邮箱验证码建立账户 Session；RainbowKit v2 + wagmi v2 + SIWE 只负责证明钱包归属，并把钱包安全绑定到当前已登录用户。细节见下方「启用钱包登录」章节。
- **M3 · 证书回铸** ✅ — `/my/orders/[code]` 与 `/my/consultations/[id]` 均带 "铸造为链上 NFT" 按钮，后端 `POST /api/certificates/:id/mint` 通过 `ASTRAYA_MINTER_PRIVATE_KEY` 调用合约，把 NFT 发给绑定的 `User.walletAddress`，并回写 `tokenId`/`txHash`/`contractAddress`/`chainId`/`mintedAt`；`/api/cert/[code]` 作为 ERC-721 `tokenURI` 返回 OpenSea 兼容的元数据；`/verify` 展示 tokenId + BaseScan 链接。详见下方「启用链上铸造」章节。
- **M4 · USDC 结账** ⏳ — `/cart` 增加 Base Sepolia USDC 付款路径，链上事件 observer 驱动订单状态。

### 启用钱包登录（M2）

1. 复制 `apps/web/.env.example` 到 `apps/web/.env`，至少配置：

   ```env
   NEXT_PUBLIC_ENABLE_WEB3="true"
   NEXT_PUBLIC_CHAIN="base-sepolia"
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="<你的 WalletConnect Cloud projectId>"
   NEXT_PUBLIC_SITE_URL="http://localhost:3000"
   ```

2. `pnpm dev` 启动。进入 `/my`，输入邮箱查询后，下方会出现 **ON-CHAIN · 链上钱包** 面板。

3. 点击 `Connect Wallet`（RainbowKit 弹窗），连上 MetaMask / Coinbase Wallet / WalletConnect。

4. 点 **"签名并绑定到当前邮箱"**：
   - 客户端向 `/api/auth/siwe/nonce` 请求一次一用的 nonce（HMAC 签名写入 httpOnly cookie）。
   - 用 `siwe` 库拼装 SIWE 消息 → 钱包签名。
   - `POST /api/auth/siwe/verify` 校验签名 + nonce + chainId → 写入 `User.walletAddress`。

5. 刷新后，登录态下的 `GET /api/my/wallet` 会返回当前账户绑定的地址，面板显示 BaseScan 链接。

> 若 `NEXT_PUBLIC_ENABLE_WEB3` 仍为 `"false"`，`/my` 只渲染预告卡片，不加载任何 wagmi/RainbowKit bundle，Phase 1 体验零影响。

### 启用链上铸造（M3）

前置：已完成 M2（钱包绑定生效），且 `pnpm contracts:compile && pnpm contracts:deploy:base-sepolia` 已在 `packages/contracts/.env` 中产出两份合约地址。

1. 在 `apps/web/.env` 追加：

   ```env
   NEXT_PUBLIC_ENABLE_WEB3="true"
   NEXT_PUBLIC_CHAIN="base-sepolia"
   NEXT_PUBLIC_SITE_URL="https://<你的部署域名>"   # tokenURI 会基于它拼接

   # 两份合约地址（M1 部署产出）
   NEXT_PUBLIC_CERTIFICATE_CONTRACT="0x…"          # AstrayaCertificate721
   NEXT_PUBLIC_DIVINATION_CONTRACT="0x…"           # AstrayaDivination721

   # 具有 MINTER_ROLE 的签名者私钥（仅后端使用，勿加 NEXT_PUBLIC_ 前缀）
   ASTRAYA_MINTER_PRIVATE_KEY="0xabc…"
   ```

2. `pnpm dev` 重启。进入 `/my/orders/<code>` 或 `/my/consultations/<id>`，每张证书卡片下方会出现 **ON-CHAIN · 链上凭证** 区块：
   - 若钱包已绑定、合约地址 & 私钥已配置 → 点击「铸造为链上 NFT」会调用 `POST /api/certificates/<id>/mint`；后端用 viem 发交易、等收据、解析 `CertificateMinted` 事件，得到 `tokenId` 后写回 DB。
   - 若钱包未绑定 → 按钮返回 `409 no_wallet_bound`，提示先到 `/my` 绑定。
   - 若合约地址或私钥为空 → 返回 `503 contract_not_configured / minter_key_missing`，UI 文案会告知「链上铸造暂未开启」。
   - 若该 `integrityHash` 已铸造过 → `409 already_minted`，UI 显示现有 tokenId + BaseScan 链接。

3. 铸成之后：
   - `GET /api/cert/<code>` 返回 OpenSea 兼容 metadata（name / description / external_url / attributes + `astraya` 扩展字段），正是合约中 `_setTokenURI` 指向的地址。
   - `/verify?nfc=...` 查询页下方的 **ON-CHAIN** 卡片会显示 tokenId、合约地址、chainId、铸造时间以及 BaseScan 交易链接。

4. 后续操作：
   - 要撤换 minter，先在 BaseScan 调用 `grantRole(MINTER_ROLE, <新地址>)` 再 `revokeRole(MINTER_ROLE, <旧地址>)`，最后更新 `ASTRAYA_MINTER_PRIVATE_KEY`。
   - 合约具备 duplicate-hash 防重铸，即便 DB 侧漏判，链上也会 revert `IntegrityHashAlreadyMinted`。

## 合规与风险提示

- Astraya 的水晶为工艺与能量藏品，**不构成医疗、法律、金融建议**。
- 大师解惑属于文化咨询范畴，回复基于经验与传统典籍，**不替代专业诊疗**。
- Phase 2 涉及 USDC 与 ERC-721，实际上线前需在发行地（建议 HK/SG/BVI）完成法律意见书与 VASP 合规审查。

## License

Proprietary — © Astraya Limited。仓库仅用于内部设计与演示。
