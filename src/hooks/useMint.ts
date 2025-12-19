"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { encodeFunctionData, decodeEventLog } from "viem";
import { sendCalls, getCallsStatus, getCapabilities, getAccount } from "@wagmi/core";
import { DIAMOND_HANDS_ADDRESS, DIAMOND_HANDS_ABI } from "@/lib/contracts";
import { wagmiConfig } from "@/providers/Providers";
import { base } from "wagmi/chains";

const PAYMASTER_URL = `https://api.developer.coinbase.com/rpc/v1/base/${process.env.NEXT_PUBLIC_PAYMASTER_API_KEY}`;
const MAX_POLL_DURATION_MS = 5 * 60 * 1000; // 5 minutes timeout

// Fisher-Yates shuffle for unbiased random selection
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function useMint() {
  const [callsId, setCallsId] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<bigint | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined);
  const pollStartTime = useRef<number>(0);

  // Poll for transaction status when we have a callsId
  useEffect(() => {
    if (!callsId) return;

    let isCancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    pollStartTime.current = Date.now();

    const pollStatus = async () => {
      if (isCancelled) return;

      // Check for timeout
      if (Date.now() - pollStartTime.current > MAX_POLL_DURATION_MS) {
        console.error("[useMint] Polling timed out after 5 minutes");
        setIsConfirming(false);
        setError(new Error("Transaction confirmation timed out. Please check your wallet."));
        return;
      }

      try {
        const status = await getCallsStatus(wagmiConfig, { id: callsId });
        if (isCancelled) return;

        console.log("[useMint] Calls status:", status);

        if (status.status === "success") {
          setIsConfirming(false);
          setIsConfirmed(true);

          // Get transaction hash from receipts
          if (status.receipts && status.receipts.length > 0) {
            setHash(status.receipts[0].transactionHash);

            // Parse tokenId from logs using proper event decoding
            for (const receipt of status.receipts) {
              for (const log of receipt.logs) {
                // Validate topics structure before type assertion
                const topics = log.topics;
                if (
                  !Array.isArray(topics) ||
                  topics.length === 0 ||
                  !topics.every((t) => typeof t === "string" && t.startsWith("0x"))
                ) {
                  continue;
                }

                try {
                  const decoded = decodeEventLog({
                    abi: DIAMOND_HANDS_ABI,
                    data: log.data,
                    topics: topics as [signature: `0x${string}`, ...args: `0x${string}`[]],
                  });

                  // Check for DiamondHandsMinted or PaperHandsMinted events
                  if (decoded.eventName === "DiamondHandsMinted" || decoded.eventName === "PaperHandsMinted") {
                    const args = decoded.args as { player: string; tokenId: bigint; duration: bigint };
                    setTokenId(args.tokenId);
                    console.log("[useMint] TokenId:", args.tokenId.toString());
                  }
                } catch {
                  // Not our event (different contract), skip silently
                }
              }
            }
          }
          return; // Stop polling
        }

        if (status.status === "pending") {
          setIsConfirming(true);
          // Continue polling with cleanup tracking
          timeoutId = setTimeout(pollStatus, 2000);
        } else {
          // Handle failed or other status
          console.error("[useMint] Transaction failed with status:", status.status);
          setIsConfirming(false);
          setError(new Error(`Transaction failed: ${status.status}`));
        }
      } catch (e) {
        if (isCancelled) return;
        console.error("[useMint] Poll error:", e);
        setIsConfirming(false);
        setError(e as Error);
      }
    };

    pollStatus();

    // Cleanup function to prevent memory leaks and race conditions
    return () => {
      isCancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [callsId]);

  const mint = useCallback(async (
    playerAddress: `0x${string}`,
    durationSeconds: number,
    messages: string[] = []
  ) => {
    console.log("[useMint] mint() called");

    setIsPending(true);
    setError(null);
    setIsConfirmed(false);
    setIsConfirming(false);
    setTokenId(null);
    setHash(undefined);
    setCallsId(null); // Reset to prevent stale polling

    try {
      // Get account from wagmi
      const { address: account } = getAccount(wagmiConfig);
      if (!account) {
        throw new Error("No account connected");
      }

      // Check paymaster capability
      let supportsPaymaster = false;
      try {
        const capabilities = await getCapabilities(wagmiConfig, { account });
        const baseCapabilities = capabilities[base.id];
        supportsPaymaster = !!baseCapabilities?.paymasterService?.supported;
        console.log("[useMint] Paymaster supported:", supportsPaymaster);

        // Send to server for logging
        fetch("/api/debug/mint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "capabilities",
            account,
            supportsPaymaster,
            capabilities: baseCapabilities,
          }),
        }).catch(() => {});
      } catch (e) {
        console.log("[useMint] Could not get capabilities:", e);
        fetch("/api/debug/mint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "capabilities_error",
            account,
            error: e instanceof Error ? e.message : String(e),
          }),
        }).catch(() => {});
      }

      // Floor to whole seconds since timer has sub-second precision
      const duration = BigInt(Math.floor(durationSeconds));
      // Select up to 12 messages for the NFT using Fisher-Yates shuffle
      const shuffled = shuffleArray(messages);
      const messagesForNft = shuffled.slice(0, 12);

      console.log("[useMint] Messages for NFT:", messagesForNft.length);

      // Encode the mint function call
      const data = encodeFunctionData({
        abi: DIAMOND_HANDS_ABI,
        functionName: "mint",
        args: [playerAddress, duration, messagesForNft],
      });

      // Send the call using EIP-5792
      const result = await sendCalls(wagmiConfig, {
        account,
        calls: [{ to: DIAMOND_HANDS_ADDRESS, data }],
        chainId: base.id,
        capabilities: supportsPaymaster
          ? { paymasterService: { url: PAYMASTER_URL } }
          : undefined,
      });

      console.log("[useMint] Calls sent, id:", result.id);
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
