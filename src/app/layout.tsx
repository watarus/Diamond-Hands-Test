import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers/Providers";

// Vercel provides VERCEL_URL for preview deployments
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3333");

export const metadata: Metadata = {
  title: "Diamond Hands Test 💎🙌",
  description: "FUDに耐えてボタンを押し続けろ。あなたの握力をBaseチェーンに証明するミニアプリ。",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "Diamond Hands Test 💎🙌",
    description: "FUDに耐えてボタンを押し続けろ。あなたの握力をBaseチェーンに証明するミニアプリ。",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Diamond Hands Test",
      },
    ],
    type: "website",
    siteName: "Diamond Hands Test",
  },
  twitter: {
    card: "summary_large_image",
    title: "Diamond Hands Test 💎🙌",
    description: "FUDに耐えてボタンを押し続けろ。あなたの握力をBaseチェーンに証明するミニアプリ。",
    images: ["/api/og"],
  },
  other: {
    // Farcaster Frame metadata
    "fc:frame": "vNext",
    "fc:frame:image": `${SITE_URL}/api/og`,
    "fc:frame:button:1": "Play Diamond Hands Test",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased min-h-screen bg-background">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
