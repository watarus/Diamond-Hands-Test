import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const duration = searchParams.get("duration");
  const isDiamond = duration ? parseInt(duration) >= 60 : null;

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
            fontFamily: "sans-serif",
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
      }
    );
  }

  // Result OG image
  const mins = Math.floor(parseInt(duration) / 60);
  const secs = parseInt(duration) % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

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
          fontFamily: "sans-serif",
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
    }
  );
}
