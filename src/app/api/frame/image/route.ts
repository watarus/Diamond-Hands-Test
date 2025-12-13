import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const duration = parseInt(searchParams.get("duration") || "0", 10);
  const isDiamondHands = duration >= 60;

  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const emoji = isDiamondHands ? "💎" : "📄";
  const title = isDiamondHands ? "DIAMOND HANDS" : "PAPER HANDS";
  const bgColor = isDiamondHands ? "#00D4FF" : "#FFD700";
  const message = isDiamondHands
    ? "FUDに耐えきった！"
    : "FUDに負けた...";

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0a0a0a"/>
  <rect x="40" y="40" width="1120" height="550" rx="40" fill="${bgColor}"/>
  <text x="600" y="200" font-size="120" text-anchor="middle">${emoji}</text>
  <text x="600" y="320" font-size="64" font-weight="bold" fill="#000" text-anchor="middle">${title}</text>
  <text x="600" y="420" font-size="80" font-family="monospace" fill="#000" text-anchor="middle">${timeStr}</text>
  <text x="600" y="500" font-size="32" fill="#000" text-anchor="middle">${message}</text>
  <text x="600" y="560" font-size="24" fill="#333" text-anchor="middle">Diamond Hands Test on Base</text>
</svg>
  `.trim();

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
