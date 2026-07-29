"use client";

import { Web3Provider } from "./Web3Provider";
import { WalletBindCard } from "./WalletBindCard";

/**
 * Single mounting point the /my page lazy-loads when
 * `NEXT_PUBLIC_ENABLE_WEB3 === "true"`. Keeping both the provider stack and
 * the card in one module lets `next/dynamic` emit a single chunk.
 */
export default function WalletBindMounted() {
  return (
    <Web3Provider>
      <WalletBindCard />
    </Web3Provider>
  );
}
