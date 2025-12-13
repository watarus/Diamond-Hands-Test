"use client";

import type { GameResult } from "@/hooks/useGame";

// Share Button Component
function ShareButton({
  platform,
  duration,
  isDiamondHands,
}: {
  platform: "warpcast" | "twitter";
  duration: number;
  isDiamondHands: boolean;
}) {
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const frameUrl = `${siteUrl}/api/frame?duration=${Math.floor(duration)}`;

  const emoji = isDiamondHands ? "💎" : "📄";
  const title = isDiamondHands ? "Diamond Hands" : "Paper Hands";
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const resultText = isDiamondHands
    ? `${timeStr} FUDに耐え抜いた！`
    : `${timeStr}で心が折れた...`;
  const text = `${emoji} ${title}!\n${resultText}\n\nDiamond Hands Test on Base`;

  const handleShare = () => {
    const resultUrl = `${siteUrl}/result?duration=${Math.floor(duration)}`;
    let url = "";
    if (platform === "warpcast") {
      url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(frameUrl)}`;
    } else {
      // Twitter will fetch OG image from the result page
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(resultUrl)}`;
    }
    window.open(url, "_blank");
  };

  return (
    <button
      onClick={handleShare}
      className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-all"
    >
      {platform === "warpcast" ? "🟣 Warpcast" : "𝕏 Twitter"}
    </button>
  );
}

interface ResultScreenProps {
  result: GameResult;
  onPlayAgain: () => void;
  onMint: () => void;
  isMinting: boolean;
  isConnected: boolean;
}

export function ResultScreen({
  result,
  onPlayAgain,
  onMint,
  isMinting,
  isConnected,
}: ResultScreenProps) {
  const { duration, isDiamondHands } = result;
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  const milliseconds = Math.floor((duration % 1) * 100);

  return (
    <div className="flex flex-col items-center justify-center gap-8 p-8 text-center">
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

      {/* Actions */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        {isConnected ? (
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
        ) : (
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
            platform="warpcast"
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
