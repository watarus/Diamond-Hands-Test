import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
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
          borderRadius: "20%",
        }}
      >
        <div style={{ fontSize: 400 }}>💎</div>
      </div>
    ),
    {
      width: 512,
      height: 512,
    }
  );
}
