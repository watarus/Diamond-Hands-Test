import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3333");

type Props = {
  searchParams: Promise<{ duration?: string; minted?: string; fuds?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const duration = parseInt(params.duration || "0");
  const isDiamond = duration >= 60;
  const minted = params.minted === "true";
  const fuds = params.fuds || "";

  const mins = Math.floor(duration / 60);
  const secs = duration % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const title = isDiamond ? "💎 Diamond Hands!" : "📄 Paper Hands...";
  const description = minted
    ? isDiamond
      ? `${timeStr} FUDに耐え抜いた！ NFT Minted on Base`
      : `${timeStr}で心が折れた... SBT Minted on Base`
    : isDiamond
      ? `${timeStr} FUDに耐え抜いた！`
      : `${timeStr}で心が折れた...`;

  // Build OG image URL with minted and fuds params
  let ogImageUrl = `${SITE_URL}/api/og?duration=${duration}`;
  if (minted) {
    ogImageUrl += "&minted=true";
    if (fuds) {
      ogImageUrl += `&fuds=${encodeURIComponent(fuds)}`;
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function ResultPage({ searchParams }: Props) {
  const params = await searchParams;
  const duration = parseInt(params.duration || "0");
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
