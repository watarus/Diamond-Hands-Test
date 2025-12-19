import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[Mint Debug]", JSON.stringify(body, null, 2));
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Mint Debug] Error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
