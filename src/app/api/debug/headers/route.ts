import { NextRequest, NextResponse } from "next/server";

// Debug endpoint to log request headers from Base app / Farcaster
export async function GET(request: NextRequest) {
  const headers: Record<string, string> = {};

  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  // Log to server console
  console.log("=== Debug Headers ===");
  console.log("User-Agent:", headers["user-agent"]);
  console.log("Referer:", headers["referer"]);
  console.log("Origin:", headers["origin"]);
  console.log("X-Forwarded-For:", headers["x-forwarded-for"]);
  console.log("All headers:", JSON.stringify(headers, null, 2));
  console.log("=== End Debug ===");

  return NextResponse.json({
    userAgent: headers["user-agent"],
    referer: headers["referer"],
    origin: headers["origin"],
    allHeaders: headers,
  });
}
