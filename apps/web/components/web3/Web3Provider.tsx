"use client";

import { useMemo, type ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base, baseSepolia, hardhat } from "wagmi/chains";
import { injected, coinbaseWallet, walletConnect } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

/**
 * Astraya · Web3 provider.
 *
 * Scoped to pages that need wallet access (currently `/my`). Kept out of the
 * root layout so Phase 1 users never pay the RainbowKit bundle cost.
 *
 * Chains are mirrored from `lib/web3-chains.ts` — the set of chains the UI
 * can target is {baseSepolia, base, hardhat}; the selected one comes from
 * `NEXT_PUBLIC_CHAIN`.
 */
export function Web3Provider({ children }: { children: ReactNode }) {
  const config = useMemo(() => {
    const projectId = (
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? ""
    ).trim();

    const baseSepoliaRpc = (
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ?? ""
    ).trim();
    const baseMainnetRpc = (
      process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL ?? ""
    ).trim();

    const connectors = [
      injected({ shimDisconnect: true }),
      coinbaseWallet({ appName: "Astraya · 星脉" }),
      ...(projectId
        ? [
            walletConnect({
              projectId,
              showQrModal: true,
              metadata: {
                name: "Astraya · 星脉",
                description:
                  "星辰脉络中，万物有灵。水晶臻选 · 大师解惑 · 链上溯源。",
                url:
                  typeof window !== "undefined"
                    ? window.location.origin
                    : "http://localhost:3000",
                icons: [],
              },
            }),
          ]
        : []),
    ];

    return createConfig({
      chains: [baseSepolia, base, hardhat],
      connectors,
      transports: {
        [baseSepolia.id]: http(baseSepoliaRpc || undefined),
        [base.id]: http(baseMainnetRpc || undefined),
        [hardhat.id]: http("http://127.0.0.1:8545"),
      },
      ssr: true,
    });
  }, []);

  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={baseSepolia}
          theme={darkTheme({
            accentColor: "#e8c37a",
            accentColorForeground: "#0a0e27",
            borderRadius: "large",
            fontStack: "system",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
