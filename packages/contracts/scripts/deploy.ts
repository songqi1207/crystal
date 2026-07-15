import { ethers, network } from "hardhat";

/**
 * Astraya — one-shot deploy script for AstrayaCertificate721 &
 * AstrayaDivination721 on any configured network (default: baseSepolia).
 *
 * Usage (from packages/contracts):
 *   pnpm deploy:local          # against `pnpm node`
 *   pnpm deploy:base-sepolia   # against Base Sepolia testnet
 *
 * Required env (see .env.example):
 *   DEPLOYER_PRIVATE_KEY   — hex key funded with Base Sepolia ETH
 *   ROYALTY_RECEIVER       — optional; defaults to deployer
 *   ROYALTY_FEE_BPS        — optional; defaults to 500 (5%)
 *   INITIAL_MINTER         — optional; defaults to deployer
 *
 * After a successful run the script prints a copy-pasteable block for
 *   apps/web/.env:
 *     NEXT_PUBLIC_CERTIFICATE_CONTRACT=0x...
 *     NEXT_PUBLIC_DIVINATION_CONTRACT=0x...
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  const royaltyReceiver =
    process.env.ROYALTY_RECEIVER && process.env.ROYALTY_RECEIVER !== ""
      ? process.env.ROYALTY_RECEIVER
      : deployer.address;
  const royaltyFeeBps = BigInt(process.env.ROYALTY_FEE_BPS ?? "500");
  const initialMinter =
    process.env.INITIAL_MINTER && process.env.INITIAL_MINTER !== ""
      ? process.env.INITIAL_MINTER
      : deployer.address;
  const admin = deployer.address;

  console.log("—".repeat(72));
  console.log(`  Astraya contracts · deploying to ${network.name}`);
  console.log("—".repeat(72));
  console.log(`  Deployer        : ${deployer.address}`);
  console.log(`  Balance         : ${ethers.formatEther(balance)} ETH`);
  console.log(`  Admin           : ${admin}`);
  console.log(`  Initial minter  : ${initialMinter}`);
  console.log(`  Royalty receiver: ${royaltyReceiver}`);
  console.log(`  Royalty fee     : ${royaltyFeeBps.toString()} bps`);
  console.log("—".repeat(72));

  const CertFactory = await ethers.getContractFactory("AstrayaCertificate721");
  const cert = await CertFactory.deploy(
    admin,
    initialMinter,
    royaltyReceiver,
    royaltyFeeBps,
  );
  await cert.waitForDeployment();
  const certAddress = await cert.getAddress();
  console.log(`  ✓ AstrayaCertificate721 → ${certAddress}`);

  const DivFactory = await ethers.getContractFactory("AstrayaDivination721");
  const div = await DivFactory.deploy(
    admin,
    initialMinter,
    royaltyReceiver,
    royaltyFeeBps,
  );
  await div.waitForDeployment();
  const divAddress = await div.getAddress();
  console.log(`  ✓ AstrayaDivination721  → ${divAddress}`);

  console.log("—".repeat(72));
  console.log("  Copy into apps/web/.env:");
  console.log("");
  console.log(`    NEXT_PUBLIC_CHAIN=${chainLabelFor(network.name)}`);
  console.log(`    NEXT_PUBLIC_CERTIFICATE_CONTRACT=${certAddress}`);
  console.log(`    NEXT_PUBLIC_DIVINATION_CONTRACT=${divAddress}`);
  console.log("—".repeat(72));
}

function chainLabelFor(networkName: string): string {
  switch (networkName) {
    case "base":
      return "base";
    case "baseSepolia":
      return "base-sepolia";
    case "localhost":
    case "hardhat":
      return "hardhat";
    default:
      return networkName;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
