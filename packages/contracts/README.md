# `@astraya/contracts`

Phase 2 smart-contract workspace for **Astraya · 星脉**. Ships two ERC-721
contracts that mirror the off-chain `Certificate` table:

- `AstrayaCertificate721` — on-chain certificate for a physical crystal.
- `AstrayaDivination721` — on-chain certificate for a master consultation.

Both share `AstrayaCertificateBase`, which adds:

- `MINTER_ROLE` gated `mint(address to, bytes32 integrityHash, string uri)`
- Duplicate-hash protection (`IntegrityHashAlreadyMinted`)
- Per-token `tokenURI` via `ERC721URIStorage`
- EIP-2981 default royalty (configurable by admin)
- OpenZeppelin v5 `AccessControl` for admin / minter separation

The `integrityHash` is the same `sha256(canonical JSON payload)` that Phase 1
already writes into `Certificate.integrityHash` — so an off-chain certificate
can be re-minted on-chain without schema churn.

## Quick start

```bash
# from repo root
pnpm install

# compile + run tests (Hardhat uses an in-memory chain)
pnpm --filter @astraya/contracts compile
pnpm --filter @astraya/contracts test

# gas report (optional)
REPORT_GAS=1 pnpm --filter @astraya/contracts test:gas
```

## Deploy to Base Sepolia

1. Copy `.env.example` to `.env` inside this package and fill in
   `DEPLOYER_PRIVATE_KEY` + `BASESCAN_API_KEY`.
2. Fund the deployer with Base Sepolia ETH (Coinbase faucet).
3. Run:

   ```bash
   pnpm --filter @astraya/contracts deploy:base-sepolia
   ```

   The script prints the deployed addresses. Copy them into
   `apps/web/.env`:

   ```env
   NEXT_PUBLIC_CHAIN=base-sepolia
   NEXT_PUBLIC_CERTIFICATE_CONTRACT=0x...
   NEXT_PUBLIC_DIVINATION_CONTRACT=0x...
   ```

4. (Optional) verify on BaseScan:

   ```bash
   pnpm --filter @astraya/contracts exec hardhat verify \
     --network baseSepolia <address> \
     <admin> <minter> <royaltyReceiver> <royaltyFeeBps>
   ```

## Design notes

- **Why two contracts, not one with a `kind` enum?**
  OpenSea / BaseScan / 3rd-party wallets classify tokens by contract address.
  Divination certificates live a very different emotional life than product
  certificates; keeping them as separate collections makes royalty splits and
  marketplace UX cleaner.

- **Why store only `integrityHash` on-chain?**
  Keeps gas cost low and respects user privacy — the full certificate payload
  lives off-chain (database today, IPFS in M4). Anyone with the tokenURI can
  still fetch the payload and recompute the hash to verify integrity.

- **`MINTER_ROLE` vs. `DEFAULT_ADMIN_ROLE`**
  The platform backend holds `MINTER_ROLE` (hot wallet, can mint but not
  reconfigure). Royalties, role grants and future upgrades stay with the
  treasury multisig that holds `DEFAULT_ADMIN_ROLE`.
