"use client";

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
import { useAccount } from "wagmi";

export function ConnectWallet() {
  const { isConnected } = useAccount();

  return (
    <div className="flex items-center">
      <Wallet>
        <OnchainConnectWallet
          className={`
            px-4 py-2 rounded-lg font-medium
            ${isConnected
              ? "bg-gray-800 text-white"
              : "bg-diamond text-black hover:bg-diamond/80"
            }
            transition-all duration-200
          `}
        >
          <Avatar className="h-6 w-6" />
          <Name />
        </OnchainConnectWallet>
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
            View Wallet
          </WalletDropdownLink>
          <WalletDropdownDisconnect />
        </WalletDropdown>
      </Wallet>
    </div>
  );
}
