"use client";

import { useSendCalls, useCallsStatus } from "wagmi/experimental";
import { encodeFunctionData, concat, toHex } from "viem";
import { DIAMOND_HANDS_ADDRESS, DIAMOND_HANDS_ABI } from "@/lib/contracts";
import { base } from "wagmi/chains";

// Builder Code for Base attribution (ERC-8021)
const BUILDER_CODE = "bc_vctya6xa";

export function useMint() {
  const {
    sendCalls,
    data: callsId,
    isPending: isWritePending,
    error: writeError,
  } = useSendCalls();

  // Extract the actual ID string from the sendCalls response
  const callsIdString = typeof callsId === "string" ? callsId : callsId?.id;

  const {
    data: callsStatus,
    isLoading: isConfirming,
    error: confirmError,
  } = useCallsStatus({
    id: callsIdString as string,
    query: {
      enabled: !!callsIdString,
      refetchInterval: (data) =>
        data.state.data?.status === "success" ? false : 1000,
    },
  });

  const isConfirmed = callsStatus?.status === "success";

  const mint = async (playerAddress: `0x${string}`, durationSeconds: number) => {
    const duration = BigInt(Math.floor(durationSeconds));

    // Encode the mint function call
    const callData = encodeFunctionData({
      abi: DIAMOND_HANDS_ABI,
      functionName: "mint",
      args: [playerAddress, duration],
    });

    // Append Builder Code suffix (ERC-8021) for Base attribution
    const builderCodeSuffix = toHex(BUILDER_CODE);
    const dataWithBuilderCode = concat([callData, builderCodeSuffix]);

    sendCalls({
      calls: [
        {
          to: DIAMOND_HANDS_ADDRESS,
          data: dataWithBuilderCode,
        },
      ],
      capabilities: {
        auxiliaryFunds: {
          supported: true,
        },
      } as Record<string, unknown>,
      chainId: base.id,
    });
  };

  return {
    mint,
    hash: callsStatus?.receipts?.[0]?.transactionHash,
    isPending: isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || confirmError,
  };
}
