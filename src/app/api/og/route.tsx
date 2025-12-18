import { ImageResponse } from "next/og";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { DIAMOND_HANDS_ADDRESS, DIAMOND_HANDS_ABI } from "@/lib/contracts";

export const runtime = "edge";

// Load Noto Sans JP font for Japanese text (OTF format required by next/og)
async function loadFont(): Promise<ArrayBuffer> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3333";
  const res = await fetch(`${baseUrl}/fonts/NotoSansJP-Regular.otf`);
  return res.arrayBuffer();
}

// Use dRPC for Base - CDP RPC gets blocked from Vercel Edge by Cloudflare
const getRpcUrl = () => {
  const drpcKey = process.env.DRPC_API_KEY;
  if (drpcKey) {
    return `https://lb.drpc.org/ogrpc?network=base&dkey=${drpcKey}`;
  }
  // Fallback to public RPC
  return "https://base-rpc.publicnode.com";
};

// FUD positions for NFT-style image (card is 500px centered, so 350-850)
const FUD_POSITIONS = [
  { x: 30, y: 60 },
  { x: 75, y: 140 },
  { x: 45, y: 220 },
  { x: 65, y: 300 },
  { x: 35, y: 380 },
  { x: 80, y: 460 },
  { x: 885, y: 80 },
  { x: 920, y: 160 },
  { x: 895, y: 240 },
  { x: 910, y: 320 },
  { x: 880, y: 400 },
  { x: 925, y: 480 },
];

// Strip emoji variation selectors that cause font loading issues
function sanitizeMessage(msg: string): string {
  // Remove variation selectors (U+FE00 to U+FE0F)
  return msg.replace(/[\uFE00-\uFE0F]/g, "");
}

// Fetch messages from contract tokenURI (works for both FUD and Good News)
async function getMessagesFromContract(tokenId: string): Promise<string[]> {
  try {
    const client = createPublicClient({
      chain: base,
      transport: http(getRpcUrl()),
    });

    const tokenURI = await client.readContract({
      address: DIAMOND_HANDS_ADDRESS,
      abi: DIAMOND_HANDS_ABI,
      functionName: "tokenURI",
      args: [BigInt(tokenId)],
    });

    // tokenURI is "data:application/json;base64,..."
    const base64Json = (tokenURI as string).split(",")[1];
    // Decode base64 with proper UTF-8 handling
    const binaryStr = atob(base64Json);
    const bytes = Uint8Array.from(binaryStr, c => c.charCodeAt(0));
    const json = JSON.parse(new TextDecoder("utf-8").decode(bytes));

    // Extract message attributes (FUD X or Good News X)
    const messages: string[] = [];
    if (json.attributes) {
      for (const attr of json.attributes) {
        if (attr.trait_type?.startsWith("FUD ") || attr.trait_type?.startsWith("Good News ")) {
          messages.push(sanitizeMessage(attr.value));
        }
      }
    }
    return messages;
  } catch (e) {
    console.error("Failed to fetch messages from contract:", e);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const duration = searchParams.get("duration");
  const isDiamond = duration ? parseInt(duration) >= 60 : null;
  const minted = searchParams.get("minted") === "true";
  const tokenId = searchParams.get("tokenId");

  // Fetch messages from contract if tokenId is provided (works for both Diamond and Paper)
  let messages: string[] = [];
  if (tokenId) {
    messages = await getMessagesFromContract(tokenId);
  }

  // Load font for Japanese text
  const fontData = await loadFont();

  // Default OG image (no result)
  if (!duration) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0a0a0a",
            fontFamily: "Noto Sans JP, sans-serif",
          }}
        >
          <div style={{ fontSize: 120, marginBottom: 20 }}>💎🙌</div>
          <div
            style={{
              fontSize: 60,
              fontWeight: "bold",
              color: "#00D4FF",
              marginBottom: 20,
            }}
          >
            Diamond Hands Test
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#888",
              textAlign: "center",
              maxWidth: 800,
            }}
          >
            FUDに耐えてボタンを押し続けろ
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#666",
              marginTop: 40,
            }}
          >
            Built on Base
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Noto Sans JP",
            data: fontData,
            style: "normal",
          },
        ],
      }
    );
  }

  // Result OG image
  const mins = Math.floor(parseInt(duration) / 60);
  const secs = parseInt(duration) % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  // NFT-style image when minted
  if (minted) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0a0a0a",
            fontFamily: "sans-serif",
            position: "relative",
          }}
        >
          {/* Messages (FUD for Paper Hands, Good News for Diamond) */}
          {messages.map((msg, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                left: FUD_POSITIONS[i]?.x || 50,
                top: FUD_POSITIONS[i]?.y || 100,
                fontSize: 14,
                fontFamily: "Noto Sans JP",
                color: isDiamond ? "#00D4FF" : "#ff0000",
                opacity: 0.7,
              }}
            >
              {msg}
            </span>
          ))}

          {/* NFT Card */}
          <div
            style={{
              width: 500,
              height: 500,
              borderRadius: 30,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: isDiamond
                ? "linear-gradient(135deg, #00D4FF 0%, #0066FF 100%)"
                : "linear-gradient(135deg, #444444 0%, #222222 100%)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ fontSize: 120, marginBottom: 10 }}>
              {isDiamond ? "💎" : "📄"}
            </div>
            <div
              style={{
                fontSize: 42,
                fontWeight: "bold",
                color: isDiamond ? "#000" : "#888",
                marginBottom: 20,
              }}
            >
              {isDiamond ? "Diamond Hands" : "Paper Hands"}
            </div>
            <div
              style={{
                fontSize: 64,
                fontWeight: "bold",
                color: isDiamond ? "#000" : "#666",
                fontFamily: "monospace",
                marginBottom: 10,
              }}
            >
              {timeStr}
            </div>
            <div
              style={{
                fontSize: 20,
                color: isDiamond ? "#000" : "#555",
              }}
            >
              HODL Time
            </div>
          </div>

        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Noto Sans JP",
            data: fontData,
            style: "normal",
          },
        ],
      }
    );
  }

  // Standard result OG image
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          fontFamily: "Noto Sans JP, sans-serif",
        }}
      >
        <div style={{ fontSize: 100, marginBottom: 20 }}>
          {isDiamond ? "💎" : "📄"}
        </div>
        <div
          style={{
            fontSize: 60,
            fontWeight: "bold",
            color: isDiamond ? "#00D4FF" : "#FFD700",
            marginBottom: 10,
          }}
        >
          {isDiamond ? "Diamond Hands!" : "Paper Hands..."}
        </div>
        <div
          style={{
            fontSize: 80,
            fontWeight: "bold",
            color: "#fff",
            fontFamily: "monospace",
            marginBottom: 20,
          }}
        >
          {timeStr}
        </div>
        <div
          style={{
            fontSize: 28,
            color: isDiamond ? "#00D4FF" : "#FFD700",
          }}
        >
          {isDiamond ? "FUDに耐え抜いた！" : "心が折れた..."}
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#666",
            marginTop: 40,
          }}
        >
          Diamond Hands Test on Base
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Noto Sans JP",
          data: fontData,
          style: "normal",
        },
      ],
    }
  );
}
