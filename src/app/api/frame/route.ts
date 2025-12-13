import { NextRequest, NextResponse } from "next/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

interface FrameResult {
  duration: number;
  isDiamondHands: boolean;
}

function generateFrameImage(result: FrameResult): string {
  const { duration, isDiamondHands } = result;
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const emoji = isDiamondHands ? "💎" : "📄";
  const title = isDiamondHands ? "DIAMOND HANDS" : "PAPER HANDS";
  const bgColor = isDiamondHands ? "%2300D4FF" : "%23FFD700";
  const message = isDiamondHands
    ? "FUDに耐えきった！"
    : "FUDに負けた...";

  // Generate SVG as data URI for the frame image
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="#0a0a0a"/>
      <rect x="40" y="40" width="1120" height="550" rx="40" fill="${bgColor.replace('%23', '#')}"/>
      <text x="600" y="200" font-size="120" text-anchor="middle">${emoji}</text>
      <text x="600" y="320" font-size="64" font-weight="bold" fill="#000" text-anchor="middle">${title}</text>
      <text x="600" y="420" font-size="80" font-family="monospace" fill="#000" text-anchor="middle">${timeStr}</text>
      <text x="600" y="500" font-size="32" fill="#000" text-anchor="middle">${message}</text>
      <text x="600" y="560" font-size="24" fill="#333" text-anchor="middle">Diamond Hands Test on Base</text>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// GET: Return frame HTML for sharing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const duration = parseInt(searchParams.get("duration") || "0", 10);
  const isDiamondHands = duration >= 60;

  const result: FrameResult = { duration, isDiamondHands };
  const imageUrl = generateFrameImage(result);

  const title = isDiamondHands ? "💎 Diamond Hands!" : "📄 Paper Hands...";
  const description = isDiamondHands
    ? `${Math.floor(duration)}秒間FUDに耐えた！Diamond Handsの証明。`
    : `${Math.floor(duration)}秒で脱落...Paper Handsの烙印。`;

  // Farcaster Frame metadata
  const frameHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${SITE_URL}/api/frame/image?duration=${duration}" />
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${SITE_URL}/api/frame/image?duration=${duration}" />
  <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
  <meta property="fc:frame:button:1" content="🎮 Play Diamond Hands Test" />
  <meta property="fc:frame:button:1:action" content="link" />
  <meta property="fc:frame:button:1:target" content="${SITE_URL}" />
  <meta property="fc:frame:button:2" content="📊 View on Base" />
  <meta property="fc:frame:button:2:action" content="link" />
  <meta property="fc:frame:button:2:target" content="https://basescan.org" />
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <a href="${SITE_URL}">Play Diamond Hands Test</a>
</body>
</html>
  `;

  return new NextResponse(frameHtml, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}

// POST: Handle frame interactions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { untrustedData } = body;

    // Handle button clicks
    const buttonIndex = untrustedData?.buttonIndex;

    if (buttonIndex === 1) {
      // Redirect to game
      return NextResponse.redirect(SITE_URL);
    }

    // Default: return to game
    return NextResponse.redirect(SITE_URL);
  } catch {
    return NextResponse.redirect(SITE_URL);
  }
}
