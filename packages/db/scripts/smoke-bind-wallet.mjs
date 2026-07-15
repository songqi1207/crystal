import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
try {
  const email = process.argv[2];
  const wallet = process.argv[3] ?? "0x0102030405060708090a0b0c0d0e0f1011121314";
  if (!email) throw new Error("usage: node smoke-bind-wallet.mjs <email> [wallet]");
  const updated = await p.user.update({
    where: { email },
    data: { walletAddress: wallet.toLowerCase() },
    select: { id: true, email: true, walletAddress: true },
  });
  console.log(JSON.stringify(updated, null, 2));
} finally {
  await p.$disconnect();
}
