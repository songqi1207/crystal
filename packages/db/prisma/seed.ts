import { PrismaClient } from "@prisma/client";
import { createHash, createHmac, randomBytes } from "node:crypto";

const prisma = new PrismaClient();

const CERT_SECRET =
  process.env.ASTRAYA_SIGNING_SECRET ??
  process.env.ASTRAYA_CERT_SECRET ??
  "astraya-dev-secret-change-me";

function serialNo(batch: string, seq: number): string {
  return `AS-${batch}-${seq.toString().padStart(4, "0")}`;
}

function fakeNfcUid(): string {
  // NTAG424 UID is 7 bytes (14 hex chars). Generate deterministically-looking.
  return randomBytes(7).toString("hex").toUpperCase();
}

function nfcHash(serial: string, uid: string): string {
  return createHmac("sha256", CERT_SECRET).update(`${serial}|${uid}`).digest("hex");
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function hmac(input: string): string {
  return createHmac("sha256", CERT_SECRET).update(input).digest("hex");
}

function randomCode(prefix: string, batch: string): string {
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${batch}-${suffix}`;
}

const PRODUCTS = [
  {
    slug: "amethyst-geode-brazil",
    name: "紫晶洞 · 巴西深紫",
    nameEn: "Amethyst Geode · Brazil Deep Violet",
    tagline: "第三眼的守护 · 净化空间的星光洞窟",
    description:
      "选自巴西米纳斯吉拉斯州的天然紫晶洞，色泽由深紫至蓝紫渐变，晶簇饱满透亮。紫晶被称为心灵之石，擅长净化空间能量、加强直觉与灵性感知。每一座紫晶洞历经数百万年地质沉积，是自然与时间的共同馈赠。",
    origin: "巴西 · 米纳斯吉拉斯",
    element: "water",
    chakra: "thirdeye",
    category: "geode",
    priceCents: 89800,
    priceCnyCents: 648000,
    images: [
      "/images/products/amethyst-geode-1.svg",
      "/images/products/amethyst-geode-2.svg",
    ],
    weightGrams: 4200,
    stock: 4,
    featured: true,
  },
  {
    slug: "rose-quartz-sphere",
    name: "粉晶球 · 莫桑比克温玉",
    nameEn: "Rose Quartz Sphere · Mozambique Glow",
    tagline: "爱的频率 · 柔化心轮的温柔之石",
    description:
      "莫桑比克手工打磨粉晶球，色泽粉润如初樱。粉晶是心轮之石的代表，带来柔和、慈悲与自我接纳的能量。适合放置于卧室、客厅或办公桌，作为情绪锚点。",
    origin: "莫桑比克",
    element: "earth",
    chakra: "heart",
    category: "polished",
    priceCents: 24800,
    priceCnyCents: 178000,
    images: ["/images/products/rose-quartz-1.svg"],
    weightGrams: 680,
    stock: 12,
    featured: true,
  },
  {
    slug: "citrine-tower-uruguay",
    name: "黄水晶柱 · 乌拉圭金阳",
    nameEn: "Citrine Tower · Uruguay Sunlit",
    tagline: "丰盛之光 · 太阳轮的能量标尺",
    description:
      "乌拉圭天然黄水晶原柱，未经热处理，保留温润阳光色。黄水晶被称为财富之石，对应太阳轮，带来自信、创造力与行动力。适合放置于工作空间或财位。",
    origin: "乌拉圭",
    element: "fire",
    chakra: "solar",
    category: "tower",
    priceCents: 39800,
    priceCnyCents: 288000,
    images: ["/images/products/citrine-tower-1.svg"],
    weightGrams: 1150,
    stock: 6,
    featured: true,
  },
  {
    slug: "black-obsidian-pendant",
    name: "黑曜石吊坠 · 墨西哥星夜",
    nameEn: "Obsidian Pendant · Mexico Night",
    tagline: "守护之盾 · 截断负能量的护身符",
    description:
      "墨西哥火山黑曜石吊坠，手工雕琢成星芒造型。黑曜石是最经典的护身石，可吸纳、反弹环境中的浑浊能量，稳定海底轮，是出差、夜归的必备之物。",
    origin: "墨西哥",
    element: "metal",
    chakra: "root",
    category: "pendant",
    priceCents: 12800,
    priceCnyCents: 92000,
    images: ["/images/products/obsidian-pendant-1.svg"],
    weightGrams: 35,
    stock: 20,
  },
  {
    slug: "labradorite-palmstone",
    name: "拉长石掌石 · 马达加斯加极光",
    nameEn: "Labradorite Palm Stone · Madagascar Aurora",
    tagline: "内在直觉 · 随掌心流动的极光",
    description:
      "马达加斯加拉长石掌石，随光线转动可见蓝金变彩（labradorescence）。拉长石唤醒直觉与第三眼，是灵性工作者与塔罗师常用的随身石。",
    origin: "马达加斯加",
    element: "water",
    chakra: "thirdeye",
    category: "polished",
    priceCents: 16800,
    priceCnyCents: 122000,
    images: ["/images/products/labradorite-1.svg"],
    weightGrams: 95,
    stock: 15,
  },
  {
    slug: "clear-quartz-cluster",
    name: "白水晶簇 · 阿肯色晨露",
    nameEn: "Clear Quartz Cluster · Arkansas Dawn",
    tagline: "万用主石 · 放大一切意念与能量",
    description:
      "美国阿肯色州白水晶簇，通透如冰。白水晶是所有水晶中的主石，能放大、储存、传递能量，是能量阵与冥想的核心配置。",
    origin: "美国 · 阿肯色",
    element: "metal",
    chakra: "crown",
    category: "raw",
    priceCents: 19800,
    priceCnyCents: 142000,
    images: ["/images/products/clear-quartz-1.svg"],
    weightGrams: 540,
    stock: 10,
  },
];

const MASTERS = [
  {
    email: "master.ziwei@astraya.dev",
    displayName: "玄青 · Ziwei",
    title: "紫微斗数 · 十二年",
    avatar: "/images/masters/ziwei.svg",
    bio:
      "师从台湾紫微斗数名家，专研命盘与流年解读。擅长事业方向、感情课题、家庭关系的系统性梳理，解惑文风温和、落地、可执行。",
    specialties: "紫微斗数,八字,流年",
    baseFeeCents: 9900,
    responseHours: 48,
    rating: 4.9,
    answeredCount: 312,
  },
  {
    email: "master.tarot@astraya.dev",
    displayName: "Luna · 露娜",
    title: "塔罗 · 水晶疗愈 · 八年",
    avatar: "/images/masters/luna.svg",
    bio:
      "英国塔罗协会认证解读师，水晶灵气疗愈师双证。擅长情绪困境、关系抉择、创造力瓶颈的直觉式引导，以牌阵配合水晶能量进行深层回应。",
    specialties: "塔罗,水晶疗愈,冥想",
    baseFeeCents: 6900,
    responseHours: 24,
    rating: 4.8,
    answeredCount: 486,
  },
  {
    email: "master.fengshui@astraya.dev",
    displayName: "方老 · Master Fang",
    title: "风水 · 空间能量 · 二十年",
    avatar: "/images/masters/fang.svg",
    bio:
      "香港堪舆名家嫡传弟子，二十年阳宅风水实战，遍布东南亚豪宅与商业空间。提供居家 / 办公布局、开光摆件、方位调整建议。",
    specialties: "风水,空间能量,开光",
    baseFeeCents: 14900,
    responseHours: 72,
    rating: 5.0,
    answeredCount: 198,
  },
];

async function main() {
  console.log("🌌  Seeding Astraya database...");

  // Wipe in FK-safe order (dev only)
  await prisma.certificate.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.master.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  // Demo buyer user
  const demoUser = await prisma.user.create({
    data: {
      email: "demo@astraya.dev",
      name: "Demo Seeker",
      locale: "zh",
      role: "user",
    },
  });

  // Masters (each has a linked User)
  const createdMasters = [] as Awaited<ReturnType<typeof prisma.master.create>>[];
  for (const m of MASTERS) {
    const user = await prisma.user.create({
      data: {
        email: m.email,
        name: m.displayName,
        role: "master",
        locale: "zh",
      },
    });
    const master = await prisma.master.create({
      data: {
        userId: user.id,
        displayName: m.displayName,
        title: m.title,
        avatar: m.avatar,
        bio: m.bio,
        specialties: m.specialties,
        baseFeeCents: m.baseFeeCents,
        responseHours: m.responseHours,
        rating: m.rating,
        answeredCount: m.answeredCount,
      },
    });
    createdMasters.push(master);
  }

  // Products + per-piece items
  const batch = new Date().toISOString().slice(2, 10).replace(/-/g, ""); // YYMMDD
  let seq = 0;
  for (const p of PRODUCTS) {
    const product = await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        nameEn: p.nameEn,
        tagline: p.tagline,
        description: p.description,
        origin: p.origin,
        element: p.element,
        chakra: p.chakra,
        category: p.category,
        priceCents: p.priceCents,
        priceCnyCents: p.priceCnyCents,
        images: JSON.stringify(p.images),
        weightGrams: p.weightGrams,
        stock: p.stock,
        featured: p.featured ?? false,
      },
    });

    // Create 2 physical pieces per SKU for demo
    for (let i = 0; i < 2; i++) {
      seq += 1;
      const serial = serialNo(batch, seq);
      const uid = fakeNfcUid();
      const hash = nfcHash(serial, uid);
      await prisma.productItem.create({
        data: {
          productId: product.id,
          serialNo: serial,
          nfcUid: uid,
          nfcHash: hash,
          blessedByMasterId: i === 0 ? createdMasters[0]!.id : null,
          blessedAt: i === 0 ? new Date() : null,
          status: "in_stock",
        },
      });
    }
  }

  // Demo: one sample delivered order + certificate (to light up "我的法器")
  const sampleProduct = await prisma.product.findFirst({ where: { slug: "rose-quartz-sphere" } });
  const sampleItem = await prisma.productItem.findFirst({ where: { productId: sampleProduct!.id } });
  if (sampleProduct && sampleItem) {
    const subtotal = sampleProduct.priceCents;
    const shipping = 2000;
    const total = subtotal + shipping;
    const orderCode = `ASTR-${batch}-DEMO`;

    const order = await prisma.order.create({
      data: {
        code: orderCode,
        userId: demoUser.id,
        email: demoUser.email!,
        subtotalCents: subtotal,
        shippingCents: shipping,
        totalCents: total,
        currency: "USD",
        shippingAddress:
          "Demo Seeker\n+65 9123 4567\nSingapore · Marina Bay Sands #42-10\npostal 018956",
        paymentMethod: "mock",
        paymentStatus: "succeeded",
        status: "delivered",
        paidAt: new Date(),
        shippedAt: new Date(),
        deliveredAt: new Date(),
        items: {
          create: [
            {
              productId: sampleProduct.id,
              itemId: sampleItem.id,
              quantity: 1,
              unitPriceCents: sampleProduct.priceCents,
            },
          ],
        },
      },
      include: { items: true },
    });

    await prisma.productItem.update({
      where: { id: sampleItem.id },
      data: { status: "delivered" },
    });

    const payload = {
      brand: "Astraya · 星脉",
      product: sampleProduct.name,
      productEn: sampleProduct.nameEn,
      origin: sampleProduct.origin,
      element: sampleProduct.element,
      chakra: sampleProduct.chakra,
      weightGrams: sampleProduct.weightGrams,
      serialNo: sampleItem.serialNo,
      nfcUid: sampleItem.nfcUid,
      nfcHash: sampleItem.nfcHash,
      blessedBy: createdMasters[0]!.displayName,
      blessedAt: new Date().toISOString(),
      orderCode: order.code,
      issuedAt: new Date().toISOString(),
    };
    const canonical = JSON.stringify(payload);
    const integrityHash = sha256(canonical);
    const signature = hmac(integrityHash);

    await prisma.certificate.create({
      data: {
        kind: "product",
        code: sampleItem.serialNo,
        userId: demoUser.id,
        orderItemId: order.items[0]!.id,
        itemId: sampleItem.id,
        payload: canonical,
        integrityHash,
        signature,
      },
    });
  }

  // Demo: one answered consultation with divination certificate
  const ziwei = createdMasters[0];
  if (ziwei) {
    const answerBody =
      "你正处于旧周期向新周期过渡的节点：紫微主星与左辅右弼形成助力格，宜在 48 日内确认主轴方向。\n\n建议：\n1. 以职涯为锚，任何决定都先看是否扩大“影响力半径”；\n2. 情感方面留出 3 个月的观察期，不急于闭合；\n3. 随身携带粉晶或紫水晶，沉淀情绪噪声。";
    const consultation = await prisma.consultation.create({
      data: {
        code: randomCode("ASK", batch),
        userId: demoUser.id,
        masterId: ziwei.id,
        feeCents: ziwei.baseFeeCents,
        currency: "USD",
        paymentMethod: "mock",
        paymentStatus: "succeeded",
        topic: "career",
        question:
          "我在香港互联网公司做了 6 年产品，想转向 AI/Web3 方向创业，但家人更希望我稳定。请帮我看一看近一年的事业方向与时机。",
        birthInfo: "阳历 1994-07-12 02:15，香港",
        answer: answerBody,
        answeredAt: new Date(),
        status: "answered",
      },
    });

    const divPayload = {
      brand: "Astraya · 星脉",
      product: `Divination · Career`,
      productEn: `Divination · Career`,
      origin: ziwei.displayName,
      element: "metal",
      chakra: "thirdeye",
      weightGrams: 0,
      serialNo: `DIV-${consultation.id.slice(0, 8).toUpperCase()}`,
      nfcUid: "",
      nfcHash: "",
      blessedBy: ziwei.displayName,
      blessedAt: new Date().toISOString(),
      orderCode: consultation.code,
      issuedAt: new Date().toISOString(),
    };
    const divCanonical = JSON.stringify(divPayload);
    const divHash = sha256(divCanonical);
    const divSig = hmac(divHash);

    await prisma.certificate.create({
      data: {
        kind: "consultation",
        code: divPayload.serialNo,
        userId: demoUser.id,
        consultationId: consultation.id,
        payload: divCanonical,
        integrityHash: divHash,
        signature: divSig,
      },
    });
  }

  console.log(`✨  Seed complete. Products: ${PRODUCTS.length}, Masters: ${MASTERS.length}`);
  console.log(`    Demo user email: demo@astraya.dev`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
