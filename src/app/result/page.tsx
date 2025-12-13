"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function ResultContent() {
  const searchParams = useSearchParams();
  const duration = parseInt(searchParams.get("duration") || "0");
  const isDiamond = duration >= 60;

  const mins = Math.floor(duration / 60);
  const secs = duration % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="text-8xl mb-6">{isDiamond ? "💎" : "📄"}</div>
      <h1
        className={`text-4xl font-bold mb-4 ${
          isDiamond ? "text-diamond" : "text-paper"
        }`}
      >
        {isDiamond ? "Diamond Hands!" : "Paper Hands..."}
      </h1>
      <div className="text-6xl font-mono font-bold text-white mb-4">
        {timeStr}
      </div>
      <p className={`text-xl ${isDiamond ? "text-diamond" : "text-paper"}`}>
        {isDiamond ? "FUDに耐え抜いた！" : "心が折れた..."}
      </p>
      <Link
        href="/"
        className="mt-8 px-6 py-3 bg-diamond text-black font-bold rounded-lg hover:opacity-80 transition-all"
      >
        自分も挑戦する
      </Link>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
