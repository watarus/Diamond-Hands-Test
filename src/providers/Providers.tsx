"use client";

import { ReactNode } from "react";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { coinbaseWallet } from "wagmi/connectors";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";

const queryClient = new QueryClient();

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    // Farcaster connector - auto-connects in Farcaster/Warpcast
    farcasterMiniApp(),
    // Coinbase wallet - for Base app and browser
    coinbaseWallet({
      appName: "Diamond Hands Test",
      preference: "all",
    }),
  ],
  transports: {
    [base.id]: http(),
  },
  ssr: false,
});

export function Providers({ children }: { children: ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY;
  const paymasterKey = process.env.NEXT_PUBLIC_PAYMASTER_API_KEY;

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={apiKey}
          chain={base}
          config={{
            appearance: {
              mode: "dark",
              name: "Diamond Hands Test",
            },
            paymaster: `https://api.developer.coinbase.com/rpc/v1/base/${paymasterKey}`,
            wallet: {
              display: "modal",
            },
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
