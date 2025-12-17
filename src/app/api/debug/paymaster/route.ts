import { NextRequest, NextResponse } from "next/server";

const PAYMASTER_URL = `https://api.developer.coinbase.com/rpc/v1/base/${process.env.NEXT_PUBLIC_PAYMASTER_API_KEY}`;

// POST: Receive wallet capabilities from client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[Paymaster Debug] Wallet capabilities received from client:");
    console.log("[Paymaster Debug] Account:", body.account);
    console.log("[Paymaster Debug] Capabilities:", JSON.stringify(body.capabilities, null, 2));
    console.log("[Paymaster Debug] Supports paymasterService:", body.supportsPaymaster);
    console.log("[Paymaster Debug] Timestamp:", body.timestamp);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Paymaster Debug] POST error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// GET: Check paymaster API configuration
export async function GET() {
  console.log("[Paymaster Debug] Checking paymaster configuration...");
  console.log("[Paymaster Debug] NEXT_PUBLIC_PAYMASTER_API_KEY exists:", !!process.env.NEXT_PUBLIC_PAYMASTER_API_KEY);
  console.log("[Paymaster Debug] NEXT_PUBLIC_ONCHAINKIT_API_KEY exists:", !!process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY);
  console.log("[Paymaster Debug] Paymaster URL:", PAYMASTER_URL.replace(/[a-zA-Z0-9]{20,}/, "***REDACTED***"));

  try {
    // Test the paymaster endpoint with a simple JSON-RPC call
    const response = await fetch(PAYMASTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "pm_getPaymasterStubData",
        params: [
          {
            sender: "0x0000000000000000000000000000000000000000",
            nonce: "0x0",
            initCode: "0x",
            callData: "0x",
            callGasLimit: "0x0",
            verificationGasLimit: "0x0",
            preVerificationGas: "0x0",
            maxFeePerGas: "0x0",
            maxPriorityFeePerGas: "0x0",
          },
          "0x0000000000000000000000000000000000000000",
          "0x2105", // Base chainId in hex
        ],
      }),
    });

    const status = response.status;
    const data = await response.json();

    console.log("[Paymaster Debug] Response status:", status);
    console.log("[Paymaster Debug] Response data:", JSON.stringify(data, null, 2));

    return NextResponse.json({
      success: status === 200,
      status,
      paymasterKeyExists: !!process.env.NEXT_PUBLIC_PAYMASTER_API_KEY,
      onchainKitKeyExists: !!process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY,
      response: data,
    });
  } catch (error) {
    console.error("[Paymaster Debug] Error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      paymasterKeyExists: !!process.env.NEXT_PUBLIC_PAYMASTER_API_KEY,
      onchainKitKeyExists: !!process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY,
    }, { status: 500 });
  }
}
