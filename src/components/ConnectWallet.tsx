"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import {
  ConnectWallet as OnchainConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from "@coinbase/onchainkit/identity";

type Platform = "base" | "farcaster" | "browser";

// Check if we're on mobile browser
function isMobileBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod|android/.test(ua) && !ua.includes("warpcast");
}

export function ConnectWallet({ platform = "browser" }: { platform?: Platform }) {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // In Farcaster, use simple connect button with farcasterMiniApp connector
  if (platform === "farcaster") {
    if (isConnected && address) {
      return (
        <span className="text-sm text-gray-400">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      );
    }

    // Find farcaster connector
    const farcasterConnector = connectors.find(c => c.id === "farcasterMiniApp");

    return (
      <button
        onClick={() => {
          if (farcasterConnector) {
            connect({ connector: farcasterConnector });
          }
        }}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors"
      >
        Connect Wallet
      </button>
    );
  }

  // For mobile browser, use simple Coinbase Wallet connect (avoid showing farcaster option)
  if (platform === "browser" && isMobileBrowser()) {
    if (isConnected && address) {
      return (
        <button
          onClick={() => disconnect()}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
        >
          {address.slice(0, 6)}...{address.slice(-4)}
        </button>
      );
    }

    // Find coinbase wallet connector
    const cbConnector = connectors.find(c => c.id === "coinbaseWalletSDK");

    return (
      <button
        onClick={() => {
          if (cbConnector) {
            connect({ connector: cbConnector });
          }
        }}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
      >
        Connect Wallet
      </button>
    );
  }

  // For Base app and desktop browser, use OnchainKit wallet UI
  return (
    <div className="flex items-center">
      <Wallet>
        <OnchainConnectWallet />
        <WalletDropdown>
          <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
            <Avatar />
            <Name />
            <Address />
            <EthBalance />
          </Identity>
          <WalletDropdownLink
            icon="wallet"
            href="https://wallet.coinbase.com"
            target="_blank"
          >
            Wallet
          </WalletDropdownLink>
          <WalletDropdownDisconnect />
        </WalletDropdown>
      </Wallet>
    </div>
  );
}
