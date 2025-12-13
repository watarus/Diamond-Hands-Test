import type { Metadata } from "next";
import { GameClient } from "@/components/GameClient";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://diamond-hands-test.vercel.app").trim();

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const isShared = params.shared === "true";
  const duration = typeof params.duration === "string" ? params.duration : "";
  const minted = params.minted === "true";
  const tokenId = typeof params.tokenId === "string" ? params.tokenId : "";
  const durationNum = duration ? parseInt(duration) : 0;
  const isDiamond = durationNum >= 60;

  // Build OG image URL with params
  // Only include duration if shared (otherwise show default landing OG)
  let ogImageUrl = `${SITE_URL}/api/og`;
  if (isShared && duration) {
    ogImageUrl += `?duration=${duration}`;
    if (minted) {
      ogImageUrl += "&minted=true";
    }
    if (tokenId) {
      ogImageUrl += `&tokenId=${tokenId}`;
    }
  }

  // Build launch URL - include query params for shared view
  let launchUrl = SITE_URL;
  if (isShared) {
    const launchParams = new URLSearchParams();
    launchParams.set("shared", "true");
    launchParams.set("duration", duration);
    if (minted) launchParams.set("minted", "true");
    if (tokenId) launchParams.set("tokenId", tokenId);
    launchUrl = `${SITE_URL}/?${launchParams.toString()}`;
  }

  // Build fc:miniapp embed for Base app and Farcaster
  const miniAppEmbed = {
    version: "1",
    imageUrl: ogImageUrl,
    button: {
      title: isShared ? "💎 自分も挑戦する" : "💎 Play",
      action: {
        type: "launch_miniapp",
        url: launchUrl,
        name: "Diamond Hands Test",
        splashImageUrl: `${SITE_URL}/splash.png`,
        splashBackgroundColor: "#0a0a0a",
      },
    },
  };

  const title = isShared
    ? isDiamond
      ? "Diamond Hands! 💎"
      : "Paper Hands... 📄"
    : "Diamond Hands Test 💎";

  const description = isShared
    ? isDiamond
      ? `${Math.floor(durationNum / 60)}:${String(durationNum % 60).padStart(2, "0")} FUDに耐え抜いた！`
      : `${Math.floor(durationNum / 60)}:${String(durationNum % 60).padStart(2, "0")}で心が折れた...`
    : "FUDに耐えてボタンを押し続けろ。60秒以上耐えれば「Diamond Hands」の称号を得られる。";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [ogImageUrl],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
    other: {
      "fc:frame": JSON.stringify(miniAppEmbed),
      "fc:miniapp": JSON.stringify(miniAppEmbed),
    },
  };
}

export default function Home() {
  return <GameClient />;
}
