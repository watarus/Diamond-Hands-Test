import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Vercel のログに出力
    console.log("[DEBUG] SDK Context received:", JSON.stringify(body, null, 2));

    return NextResponse.json({ success: true, received: body });
  } catch (error) {
    console.error("[DEBUG] Error parsing context:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}
