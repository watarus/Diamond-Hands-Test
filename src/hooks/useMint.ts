"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { DIAMOND_HANDS_ADDRESS, DIAMOND_HANDS_ABI } from "@/lib/contracts";
import { base } from "wagmi/chains";

export function useMint() {
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
  } = useWaitForTransactionReceipt({
    hash,
  });

  const mint = async (playerAddress: `0x${string}`, durationSeconds: number) => {
    // Convert duration to integer (floor)
    const duration = BigInt(Math.floor(durationSeconds));

    writeContract({
      address: DIAMOND_HANDS_ADDRESS,
      abi: DIAMOND_HANDS_ABI,
      functionName: "mint",
      args: [playerAddress, duration],
      chainId: base.id,
    });
  };

  return {
    mint,
    hash,
    isPending: isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || confirmError,
  };
}
