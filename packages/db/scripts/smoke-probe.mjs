import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
try {
  const certs = await p.certificate.findMany({
    take: 3,
    select: {
      id: true,
      code: true,
      kind: true,
      integrityHash: true,
      tokenId: true,
      contractAddress: true,
      mintedAt: true,
      user: { select: { email: true, walletAddress: true } },
    },
  });
  const items = await p.productItem.findMany({
    take: 2,
    select: { nfcUid: true, serialNo: true },
  });
  console.log(JSON.stringify({ certs, items }, null, 2));
} finally {
  await p.$disconnect();
}
