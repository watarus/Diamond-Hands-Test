import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3333";

type Props = {
  children: React.ReactNode;
  searchParams: Promise<{ duration?: string }>;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ duration?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const duration = parseInt(params.duration || "0");
  const isDiamond = duration >= 60;

  const mins = Math.floor(duration / 60);
  const secs = duration % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const title = isDiamond ? "💎 Diamond Hands!" : "📄 Paper Hands...";
  const description = isDiamond
    ? `${timeStr} FUDに耐え抜いた！`
    : `${timeStr}で心が折れた...`;
  const ogImageUrl = `${SITE_URL}/api/og?duration=${duration}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function ResultLayout({ children }: Props) {
  return <>{children}</>;
}
