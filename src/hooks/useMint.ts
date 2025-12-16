"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { encodeFunctionData } from "viem";
import { sendCalls, getCallsStatus, getCapabilities } from "@wagmi/core";
import { DIAMOND_HANDS_ADDRESS, DIAMOND_HANDS_ABI } from "@/lib/contracts";
import { wagmiConfig } from "@/providers/Providers";
import { base } from "wagmi/chains";

const PAYMASTER_URL = `https://api.developer.coinbase.com/rpc/v1/base/${process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}`;

export function useMint() {
  const { address } = useAccount();
  const [callsId, setCallsId] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<bigint | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined);

  // Poll for transaction status when we have a callsId
  useEffect(() => {
    if (!callsId) return;

    const pollStatus = async () => {
      try {
        const status = await getCallsStatus(wagmiConfig, { id: callsId });
        console.log("[useMint] Calls status:", status);

        if (status.status === "success") {
          setIsConfirming(false);
          setIsConfirmed(true);

          // Get transaction hash from receipts
          if (status.receipts && status.receipts.length > 0) {
            setHash(status.receipts[0].transactionHash);

            // Parse tokenId from logs
            for (const receipt of status.receipts) {
              for (const log of receipt.logs) {
                // Check for DiamondHandsMinted or PaperHandsMinted events
                // Event signature for DiamondHandsMinted(address,uint256,uint256)
                const diamondTopic = "0x" + "DiamondHandsMinted".padEnd(64, "0"); // simplified
                if (log.topics[0]?.includes("Minted")) {
                  // tokenId is usually the second indexed param
                  const tokenIdHex = log.topics[2];
                  if (tokenIdHex) {
                    setTokenId(BigInt(tokenIdHex));
                    console.log("[useMint] TokenId:", BigInt(tokenIdHex).toString());
                  }
                }
              }
            }
          }
          return; // Stop polling
        }

        if (status.status === "pending") {
          setIsConfirming(true);
          // Continue polling
          setTimeout(pollStatus, 2000);
        }
      } catch (e) {
        console.error("[useMint] Poll error:", e);
        setError(e as Error);
      }
    };

    pollStatus();
  }, [callsId]);

  const mint = useCallback(async (
    playerAddress: `0x${string}`,
    durationSeconds: number,
    fudMessages: string[] = []
  ) => {
    console.log("[useMint] mint() called with:", {
      playerAddress,
      durationSeconds,
      fudMessagesCount: fudMessages.length,
    });

    setIsPending(true);
    setError(null);
    setIsConfirmed(false);
    setTokenId(null);
    setHash(undefined);

    try {
      const duration = BigInt(Math.floor(durationSeconds));
      // Randomly select up to 6 FUD messages for the NFT
      const shuffled = [...fudMessages].sort(() => Math.random() - 0.5);
      const fudForNft = shuffled.slice(0, 6);

      console.log("[useMint] FUD for NFT:", fudForNft);

      // Check if paymaster is supported
      let supportsPaymaster = false;
      try {
        const capabilities = await getCapabilities(wagmiConfig, {
          account: playerAddress,
        });
        const baseCapabilities = capabilities[base.id];
        supportsPaymaster = baseCapabilities?.paymasterService?.supported ?? false;
        console.log("[useMint] Paymaster supported:", supportsPaymaster);
      } catch (e) {
        console.log("[useMint] Could not get capabilities, assuming no paymaster:", e);
      }

      // Encode the mint function call
      const data = encodeFunctionData({
        abi: DIAMOND_HANDS_ABI,
        functionName: "mint",
        args: [playerAddress, duration, fudForNft],
      });

      console.log("[useMint] Sending calls with paymaster:", supportsPaymaster);

      // Send the call using EIP-5792
      const result = await sendCalls(wagmiConfig, {
        account: playerAddress,
        calls: [
          {
            to: DIAMOND_HANDS_ADDRESS,
            data,
          },
        ],
        chainId: base.id,
        capabilities: supportsPaymaster
          ? {
              paymasterService: {
                url: PAYMASTER_URL,
              },
            }
          : undefined,
      });

      console.log("[useMint] Calls result:", result);
      setCallsId(result.id);
      setIsPending(false);
      setIsConfirming(true);
    } catch (e) {
      console.error("[useMint] Error:", e);
      setError(e as Error);
      setIsPending(false);
    }
  }, []);

  return {
    mint,
    hash,
    tokenId,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}
