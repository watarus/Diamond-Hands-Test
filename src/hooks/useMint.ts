"use client";

import { useEffect, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { decodeEventLog } from "viem";
import { DIAMOND_HANDS_ADDRESS, DIAMOND_HANDS_ABI } from "@/lib/contracts";
import { base } from "wagmi/chains";

export function useMint() {
  const [tokenId, setTokenId] = useState<bigint | null>(null);

  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Parse tokenId from transaction logs when confirmed
  useEffect(() => {
    if (isConfirmed && receipt?.logs) {
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: DIAMOND_HANDS_ABI,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "DiamondHandsMinted" || decoded.eventName === "PaperHandsMinted") {
            const args = decoded.args as { tokenId: bigint };
            setTokenId(args.tokenId);
            console.log("[useMint] TokenId from event:", args.tokenId.toString());
            break;
          }
        } catch {
          // Not our event, skip
        }
      }
    }
  }, [isConfirmed, receipt]);

  // Debug logging for state changes
  useEffect(() => {
    console.log("[useMint] State update:", {
      hash,
      isWritePending,
      isConfirming,
      isConfirmed,
      writeError: writeError?.message,
      confirmError: confirmError?.message,
    });
  }, [hash, isWritePending, isConfirming, isConfirmed, writeError, confirmError]);

  const mint = async (playerAddress: `0x${string}`, durationSeconds: number, fudMessages: string[] = []) => {
    console.log("[useMint] mint() called with:", {
      playerAddress,
      durationSeconds,
      fudMessagesCount: fudMessages.length,
      fudMessages: fudMessages.slice(0, 10),
    });

    const duration = BigInt(Math.floor(durationSeconds));
    // Randomly select up to 6 FUD messages for the NFT
    const shuffled = [...fudMessages].sort(() => Math.random() - 0.5);
    const fudForNft = shuffled.slice(0, 6);

    console.log("[useMint] FUD for NFT:", fudForNft);
    console.log("[useMint] Calling writeContract...");

    try {
      writeContract({
        address: DIAMOND_HANDS_ADDRESS,
        abi: DIAMOND_HANDS_ABI,
        functionName: "mint",
        args: [playerAddress, duration, fudForNft],
        chainId: base.id,
      });
      console.log("[useMint] writeContract called");
    } catch (e) {
      console.error("[useMint] writeContract threw:", e);
    }
  };

  return {
    mint,
    hash,
    tokenId,
    isPending: isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || confirmError,
  };
}
