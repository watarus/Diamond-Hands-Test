import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { DIAMOND_HANDS_ADDRESS, DIAMOND_HANDS_ABI } from "@/lib/contracts";

export const runtime = "edge";

const getRpcUrl = () => {
  const drpcKey = process.env.DRPC_API_KEY;
  if (drpcKey) {
    return `https://lb.drpc.org/ogrpc?network=base&dkey=${drpcKey}`;
  }
  return "https://base-rpc.publicnode.com";
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get("tokenId") || "0";

  try {
    const client = createPublicClient({
      chain: base,
      transport: http(getRpcUrl()),
    });

    // Get tokenURI
    const tokenURI = await client.readContract({
      address: DIAMOND_HANDS_ADDRESS,
      abi: DIAMOND_HANDS_ABI,
      functionName: "tokenURI",
      args: [BigInt(tokenId)],
    });

    // Decode base64 JSON with proper UTF-8 handling
    const base64Json = (tokenURI as string).split(",")[1];
    const binaryStr = atob(base64Json);
    const bytes = Uint8Array.from(binaryStr, c => c.charCodeAt(0));
    const json = JSON.parse(new TextDecoder("utf-8").decode(bytes));

    // Extract messages
    const messages: string[] = [];
    if (json.attributes) {
      for (const attr of json.attributes) {
        if (attr.trait_type?.startsWith("FUD ") || attr.trait_type?.startsWith("Good News ")) {
          messages.push(attr.value);
        }
      }
    }

    return NextResponse.json({
      tokenId,
      rpcUrl: getRpcUrl().replace(/\/[^/]+$/, "/***"), // Hide API key
      tokenURILength: (tokenURI as string).length,
      jsonParsed: true,
      attributes: json.attributes,
      extractedMessages: messages,
      imagePreview: json.image?.substring(0, 200) + "...",
    });
  } catch (error) {
    return NextResponse.json({
      tokenId,
      error: String(error),
      rpcUrl: getRpcUrl().replace(/\/[^/]+$/, "/***"),
    }, { status: 500 });
  }
}
