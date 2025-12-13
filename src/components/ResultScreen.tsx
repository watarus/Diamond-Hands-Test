"use client";

import type { GameResult } from "@/hooks/useGame";
import { DIAMOND_HANDS_ADDRESS } from "@/lib/contracts";
import { sdk } from "@farcaster/miniapp-sdk";

// Share Button Component
function ShareButton({
  platform,
  duration,
  isDiamondHands,
}: {
  platform: "base" | "twitter";
  duration: number;
  isDiamondHands: boolean;
}) {
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const resultUrl = `${siteUrl}/result?duration=${Math.floor(duration)}`;

  const emoji = isDiamondHands ? "💎" : "📄";
  const title = isDiamondHands ? "Diamond Hands" : "Paper Hands";
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const resultText = isDiamondHands
    ? `${timeStr} FUDに耐え抜いた！`
    : `${timeStr}で心が折れた...`;

  const handleShare = async () => {
    if (platform === "base") {
      const text = `${emoji} ${title}! ${resultText} - Diamond Hands Test on Base`;
      const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(resultUrl)}`;
      try {
        await sdk.actions.openUrl(url);
      } catch {
        window.open(url, "_blank");
      }
    } else {
      // Twitter/X - use native app URL scheme
      const text = `${emoji} ${title}! ${timeStr} ${isDiamondHands ? "FUDに耐え抜いた！" : "で心が折れた..."} #DiamondHandsTest #Base ${resultUrl}`;
      // Try native X app first, then fall back to web
      const nativeUrl = `twitter://post?message=${encodeURIComponent(text)}`;
      const webUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;

      // On mobile, try native app
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        window.location.href = nativeUrl;
        // If native app doesn't open after a short delay, open web version
        setTimeout(() => {
          window.open(webUrl, "_blank");
        }, 1500);
      } else {
        window.open(webUrl, "_blank");
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-all"
    >
      {platform === "base" ? "🔵 Base App" : "𝕏 Twitter"}
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

// NFT Preview Component
function NftPreview({ duration, isDiamondHands, txHash }: { duration: number; isDiamondHands: boolean; txHash?: string }) {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-gray-900 rounded-xl">
      <div className={`w-48 h-48 rounded-lg flex flex-col items-center justify-center ${isDiamondHands ? "bg-gradient-to-br from-cyan-400 to-blue-600" : "bg-gradient-to-br from-gray-400 to-gray-600"}`}>
        <span className="text-6xl">{isDiamondHands ? "💎" : "📄"}</span>
        <span className="text-white font-bold mt-2">{isDiamondHands ? "DIAMOND HANDS" : "PAPER HANDS"}</span>
        <span className="text-white/80 text-sm">{timeStr}</span>
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
  onMint: () => void;
  isMinting: boolean;
  isConnected: boolean;
  isMinted?: boolean;
  txHash?: string;
}

export function ResultScreen({
  result,
  onPlayAgain,
  onMint,
  isMinting,
  isConnected,
  isMinted = false,
  txHash,
}: ResultScreenProps) {
  const { duration, isDiamondHands } = result;
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  const milliseconds = Math.floor((duration % 1) * 100);

  return (
    <div className="flex flex-col items-center justify-center gap-8 p-8 text-center">
      {/* NFT Preview after minting */}
      {isMinted ? (
        <NftPreview duration={duration} isDiamondHands={isDiamondHands} txHash={txHash} />
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
        {!isMinted && isConnected && (
          <button
            onClick={onMint}
            disabled={isMinting}
            className={`
              px-8 py-4 rounded-xl font-bold text-lg
              transition-all duration-200
              ${
                isDiamondHands
                  ? "bg-diamond text-black hover:bg-diamond/80"
                  : "bg-paper text-black hover:bg-paper/80"
              }
              ${isMinting ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            {isMinting
              ? "Minting..."
              : isDiamondHands
              ? "Mint Diamond Hands NFT 💎"
              : "Mint Paper Hands SBT 📄"}
          </button>
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

      {/* Share */}
      <div className="flex flex-col gap-2">
        <p className="text-gray-500 text-sm">結果をシェア</p>
        <div className="flex gap-2">
          <ShareButton
            platform="base"
            duration={duration}
            isDiamondHands={isDiamondHands}
          />
          <ShareButton
            platform="twitter"
            duration={duration}
            isDiamondHands={isDiamondHands}
          />
        </div>
      </div>
    </div>
  );
}
