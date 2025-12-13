"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Transaction,
  TransactionButton,
  TransactionSponsor,
  TransactionStatus,
  TransactionStatusAction,
  TransactionStatusLabel,
  TransactionToast,
  TransactionToastIcon,
  TransactionToastLabel,
  TransactionToastAction,
} from "@coinbase/onchainkit/transaction";
import type { LifecycleStatus } from "@coinbase/onchainkit/transaction";
import type { ContractFunctionParameters } from "viem";
import { decodeEventLog } from "viem";
import type { GameResult } from "@/hooks/useGame";
import { DIAMOND_HANDS_ADDRESS, DIAMOND_HANDS_ABI } from "@/lib/contracts";
import { sdk } from "@farcaster/miniapp-sdk";
import { base } from "wagmi/chains";
import { Attribution } from "ox/erc8021";
import { useComposeCast } from "@coinbase/onchainkit/minikit";

// Builder Code for Base attribution
const BUILDER_CODE = "bc_vctya6xa";
const dataSuffix = Attribution.toDataSuffix({ codes: [BUILDER_CODE] });

type Platform = "base" | "farcaster" | "browser";

// Share Button Component
function ShareButton({
  shareTarget,
  duration,
  isDiamondHands,
  isMinted,
  tokenId,
  currentPlatform,
}: {
  shareTarget: "native" | "twitter";
  duration: number;
  isDiamondHands: boolean;
  isMinted?: boolean;
  tokenId?: string;
  currentPlatform: Platform;
}) {
  const { composeCast } = useComposeCast();
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";

  // Build share URL - use home page with shared param for mini app compatibility
  // tokenId is included so OG image can fetch FUDs from contract
  let resultUrl = `${siteUrl}/?shared=true&duration=${Math.floor(duration)}`;
  if (isMinted) {
    resultUrl += "&minted=true";
  }
  if (tokenId) {
    resultUrl += `&tokenId=${tokenId}`;
  }

  const emoji = isDiamondHands ? "💎" : "📄";
  const title = isDiamondHands ? "Diamond Hands" : "Paper Hands";
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const resultText = isDiamondHands
    ? `${timeStr} FUDに耐え抜いた！`
    : `${timeStr}で心が折れた...`;

  const handleShare = async () => {
    if (shareTarget === "native") {
      const text = `${emoji} ${title}! ${resultText} - Diamond Hands Test on Base`;

      if (currentPlatform === "base") {
        // In Base app: use composeCast from OnchainKit MiniKit
        composeCast({
          text,
          embeds: [resultUrl],
        });
      } else if (currentPlatform === "farcaster") {
        // In Farcaster: share to Warpcast via SDK
        const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(resultUrl)}`;
        try {
          await sdk.actions.openUrl(composeUrl);
        } catch {
          window.open(composeUrl, "_blank");
        }
      } else {
        // In browser: share to Warpcast
        const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(resultUrl)}`;
        window.open(composeUrl, "_blank");
      }
    } else {
      // Twitter/X
      const text = `${emoji} ${title}! ${timeStr} ${isDiamondHands ? "FUDに耐え抜いた！" : "で心が折れた..."} #DiamondHandsTest #Base ${resultUrl}`;
      const webUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;

      if (currentPlatform === "farcaster" || currentPlatform === "base") {
        // In mini app: use SDK to open external URL
        try {
          await sdk.actions.openUrl(webUrl);
        } catch {
          window.open(webUrl, "_blank");
        }
      } else {
        window.open(webUrl, "_blank");
      }
    }
  };

  // Dynamic button label based on platform
  const getNativeShareLabel = () => {
    if (currentPlatform === "farcaster") return "💬 Farcaster";
    if (currentPlatform === "base") return "🔵 Base";
    return "💬 Warpcast";
  };

  return (
    <button
      onClick={handleShare}
      className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-all"
    >
      {shareTarget === "native" ? getNativeShareLabel() : "𝕏 Twitter"}
    </button>
  );
}

// External Link Component (uses SDK in Mini App)
function ExternalLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await sdk.actions.openUrl(href);
    } catch {
      window.open(href, "_blank");
    }
  };

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}

// FUD positions for preview (12 positions)
const FUD_POSITIONS = [
  { top: 8, left: 5 },
  { top: 15, left: 50 },
  { top: 22, left: 10 },
  { top: 29, left: 55 },
  { top: 36, left: 5 },
  { top: 43, left: 50 },
  { top: 50, left: 8 },
  { top: 57, left: 52 },
  { top: 64, left: 5 },
  { top: 71, left: 50 },
  { top: 78, left: 10 },
  { top: 85, left: 55 },
];

// NFT Preview Component - uses messages passed from parent (already supplemented)
function NftPreview({ duration, isDiamondHands, txHash, messages }: { duration: number; isDiamondHands: boolean; txHash?: string; messages: string[] }) {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-gray-900 rounded-xl">
      <div className={`relative w-56 h-56 rounded-lg flex flex-col items-center justify-center overflow-hidden ${isDiamondHands ? "bg-gradient-to-br from-cyan-400 to-blue-600" : "bg-gradient-to-br from-gray-600 to-gray-800"}`}>
        {/* Messages (FUD for Paper, Good News for Diamond) */}
        {messages.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {messages.slice(0, 12).map((msg, i) => (
              <span
                key={i}
                className={`absolute text-[7px] font-bold whitespace-nowrap ${isDiamondHands ? "text-cyan-200" : "text-red-500"}`}
                style={{
                  top: `${FUD_POSITIONS[i]?.top || 50}%`,
                  left: `${FUD_POSITIONS[i]?.left || 50}%`,
                  opacity: 0.7,
                }}
              >
                {msg}
              </span>
            ))}
          </div>
        )}
        <span className="text-6xl z-10 drop-shadow-lg">{isDiamondHands ? "💎" : "📄"}</span>
        <span className="text-white font-bold mt-2 z-10 drop-shadow-lg">{isDiamondHands ? "DIAMOND HANDS" : "PAPER HANDS"}</span>
        <span className="text-white/80 text-sm z-10 drop-shadow">{timeStr}</span>
      </div>
      <p className="text-green-400 text-sm">✓ Minted successfully!</p>
      {txHash && (
        <ExternalLink
          href={`https://basescan.org/tx/${txHash}`}
          className="text-blue-400 hover:text-blue-300 text-xs underline"
        >
          View on BaseScan
        </ExternalLink>
      )}
      <ExternalLink
        href={`https://opensea.io/assets/base/${DIAMOND_HANDS_ADDRESS}`}
        className="text-blue-400 hover:text-blue-300 text-xs underline"
      >
        View on OpenSea
      </ExternalLink>
    </div>
  );
}

interface ResultScreenProps {
  result: GameResult;
  onPlayAgain: () => void;
  isConnected: boolean;
  address?: `0x${string}`;
  platform: Platform;
}

export function ResultScreen({
  result,
  onPlayAgain,
  isConnected,
  address,
  platform,
}: ResultScreenProps) {
  const { duration, isDiamondHands, messages } = result;
  const [isMinted, setIsMinted] = useState(false);
  const [txHash, setTxHash] = useState<string | undefined>();
  const [tokenId, setTokenId] = useState<string | undefined>();
  const [supplementedMessages, setSupplementedMessages] = useState<string[]>(messages);

  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  const milliseconds = Math.floor((duration % 1) * 100);

  // Fetch additional messages if we don't have enough for NFT (need 12)
  // Diamond Hands: fetch good news, Paper Hands: fetch FUD
  useEffect(() => {
    if (messages.length < 12) {
      const apiUrl = isDiamondHands ? "/api/good-news" : "/api/fud";
      const dataKey = isDiamondHands ? "news" : "fuds";

      fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
          if (data[dataKey] && Array.isArray(data[dataKey])) {
            // Combine with existing, avoid duplicates, take up to 12
            const combined = [...messages];
            for (const msg of data[dataKey]) {
              if (!combined.includes(msg) && combined.length < 12) {
                combined.push(msg);
              }
            }
            setSupplementedMessages(combined);
            console.log("[Mint] Supplemented messages:", messages.length, "->", combined.length);
          }
        })
        .catch(console.error);
    }
  }, [messages, isDiamondHands]);

  // Build contract calls for minting
  const contracts = useMemo(() => {
    if (!address) return [];

    // Select 12 random messages for the NFT (FUD for Paper, Good News for Diamond)
    const shuffled = [...supplementedMessages].sort(() => Math.random() - 0.5);
    const messagesForNft = shuffled.slice(0, 12);

    console.log("[Mint] Total messages collected:", supplementedMessages.length);
    console.log("[Mint] Messages for NFT:", messagesForNft);

    const contractCall = {
      address: DIAMOND_HANDS_ADDRESS,
      abi: DIAMOND_HANDS_ABI,
      functionName: "mint",
      args: [address, BigInt(Math.floor(duration)), messagesForNft],
    };

    console.log("[Mint] Contract call:", {
      address: contractCall.address,
      functionName: contractCall.functionName,
      args: {
        player: address,
        duration: Math.floor(duration),
        messages: messagesForNft,
      },
    });

    return [contractCall] as ContractFunctionParameters[];
  }, [address, duration, supplementedMessages]);

  const handleOnStatus = (status: LifecycleStatus) => {
    console.log("[Transaction] Status:", status.statusName, status.statusData);
    if (status.statusName === "error") {
      console.error("[Transaction] Error details:", status.statusData);
    }
    if (status.statusName === "success") {
      setIsMinted(true);
      const receipt = status.statusData?.transactionReceipts?.[0];
      if (receipt?.transactionHash) {
        setTxHash(receipt.transactionHash);
      }
      // Parse tokenId from transaction logs
      if (receipt?.logs) {
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: DIAMOND_HANDS_ABI,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === "DiamondHandsMinted" || decoded.eventName === "PaperHandsMinted") {
              const args = decoded.args as { tokenId: bigint };
              setTokenId(args.tokenId.toString());
              console.log("[Transaction] TokenId:", args.tokenId.toString());
              break;
            }
          } catch {
            // Not our event, skip
          }
        }
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 p-8 text-center">
      {/* NFT Preview after minting */}
      {isMinted ? (
        <NftPreview duration={duration} isDiamondHands={isDiamondHands} txHash={txHash} messages={supplementedMessages} />
      ) : (
        <>
          {/* Result Icon */}
          <div className="text-8xl">
            {isDiamondHands ? "💎" : "📄"}
          </div>

          {/* Title */}
          <h1
            className={`text-4xl md:text-6xl font-bold ${
              isDiamondHands ? "text-diamond" : "text-paper"
            }`}
          >
            {isDiamondHands ? "DIAMOND HANDS" : "PAPER HANDS"}
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-400">
            {isDiamondHands
              ? "あなたはFUDに耐えきった！真の握力の持ち主だ。"
              : "あなたはFUDに負けた...握力雑魚です。"}
          </p>

          {/* Duration */}
          <div className="bg-gray-900 rounded-xl p-6 min-w-[300px]">
            <p className="text-sm text-gray-500 mb-2">YOUR HODL TIME</p>
            <p className="font-mono text-4xl font-bold">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}.
              {String(milliseconds).padStart(2, "0")}
            </p>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        {!isMinted && isConnected && address && (
          <Transaction
            chainId={base.id}
            calls={contracts}
            onStatus={handleOnStatus}
            isSponsored={true}
            capabilities={{ dataSuffix } as Record<string, unknown>}
          >
            <TransactionButton
              text={isDiamondHands ? "Mint Diamond Hands NFT 💎" : "Mint Paper Hands SBT 📄"}
              className={`
                px-8 py-4 rounded-xl font-bold text-lg w-full
                ${isDiamondHands
                  ? "bg-diamond text-black hover:bg-diamond/80"
                  : "bg-paper text-black hover:bg-paper/80"
                }
              `}
            />
            <TransactionSponsor />
            <TransactionStatus>
              <TransactionStatusLabel />
              <TransactionStatusAction />
            </TransactionStatus>
            <TransactionToast>
              <TransactionToastIcon />
              <TransactionToastLabel />
              <TransactionToastAction />
            </TransactionToast>
          </Transaction>
        )}

        {!isMinted && !isConnected && (
          <p className="text-gray-500 text-sm">
            ウォレットを接続してNFT/SBTをミント
          </p>
        )}

        <button
          onClick={onPlayAgain}
          className="px-8 py-4 rounded-xl font-bold text-lg bg-gray-800 text-white hover:bg-gray-700 transition-all duration-200"
        >
          Play Again
        </button>
      </div>

      {/* Share - only show after minting */}
      {isMinted && (
        <div className="flex flex-col gap-2">
          <p className="text-gray-500 text-sm">NFTをシェア</p>
          <div className="flex gap-2">
            <ShareButton
              shareTarget="native"
              duration={duration}
              isDiamondHands={isDiamondHands}
              isMinted={isMinted}
              tokenId={tokenId}
              currentPlatform={platform}
            />
            <ShareButton
              shareTarget="twitter"
              duration={duration}
              isDiamondHands={isDiamondHands}
              isMinted={isMinted}
              tokenId={tokenId}
              currentPlatform={platform}
            />
          </div>
        </div>
      )}
    </div>
  );
}
