import { NextResponse } from "next/server";

export const runtime = "edge";

// Whitelist of allowed context fields to prevent log injection
interface SafeContext {
  context?: {
    client?: {
      clientFid?: number;
      added?: boolean;
      clientProtocol?: string;
    };
  };
  userAgent?: string;
  isInIframe?: boolean;
  timestamp?: string;
}

function sanitizeContext(body: unknown): SafeContext {
  if (typeof body !== "object" || body === null) {
    return {};
  }

  const raw = body as Record<string, unknown>;
  const safe: SafeContext = {};

  // Only extract known safe fields
  if (typeof raw.userAgent === "string") {
    safe.userAgent = raw.userAgent.slice(0, 500); // Limit length
  }
  if (typeof raw.isInIframe === "boolean") {
    safe.isInIframe = raw.isInIframe;
  }
  if (typeof raw.timestamp === "string") {
    safe.timestamp = raw.timestamp.slice(0, 50);
  }

  // Extract context with validation
  if (typeof raw.context === "object" && raw.context !== null) {
    const ctx = raw.context as Record<string, unknown>;
    safe.context = {};

    if (typeof ctx.client === "object" && ctx.client !== null) {
      const client = ctx.client as Record<string, unknown>;
      safe.context.client = {};

      if (typeof client.clientFid === "number") {
        safe.context.client.clientFid = client.clientFid;
      }
      if (typeof client.added === "boolean") {
        safe.context.client.added = client.added;
      }
      if (typeof client.clientProtocol === "string") {
        safe.context.client.clientProtocol = client.clientProtocol.slice(0, 50);
      }
    }
  }

  return safe;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Sanitize input to prevent log injection
    const safeContext = sanitizeContext(body);

    // Log only sanitized data
    console.log("[DEBUG] SDK Context received:", JSON.stringify(safeContext, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DEBUG] Error parsing context:", error);
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
