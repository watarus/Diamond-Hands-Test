import { NextRequest, NextResponse } from "next/server";

const PAYMASTER_URL = `https://api.developer.coinbase.com/rpc/v1/base/${process.env.NEXT_PUBLIC_PAYMASTER_API_KEY}`;

// ERC-4337 EntryPoint v0.6 on Base
const ENTRYPOINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

// POST: Receive wallet capabilities from client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("[Paymaster Debug] ====== WALLET CAPABILITIES ======");
    console.log("[Paymaster Debug] Account:", body.account);
    console.log("[Paymaster Debug] Timestamp:", body.timestamp);

    if (body.error) {
      console.log("[Paymaster Debug] ERROR getting capabilities:", body.error);
      console.log("[Paymaster Debug] Supports paymasterService: UNKNOWN (error)");
    } else {
      console.log("[Paymaster Debug] Supports paymasterService:", body.supportsPaymaster);
      console.log("[Paymaster Debug] Full capabilities:", JSON.stringify(body.capabilities, null, 2));
    }
    console.log("[Paymaster Debug] ================================");

    return NextResponse.json({
      received: true,
      walletSupportsPaymaster: body.supportsPaymaster,
    });
  } catch (error) {
    console.error("[Paymaster Debug] POST error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// GET: Check paymaster API configuration
export async function GET() {
  const results = {
    apiKeyConfigured: !!process.env.NEXT_PUBLIC_PAYMASTER_API_KEY,
    apiKeyValid: false,
    paymasterResponding: false,
    error: null as string | null,
  };

  console.log("[Paymaster Debug] ====== API KEY CHECK ======");
  console.log("[Paymaster Debug] NEXT_PUBLIC_PAYMASTER_API_KEY exists:", results.apiKeyConfigured);
  console.log("[Paymaster Debug] NEXT_PUBLIC_ONCHAINKIT_API_KEY exists:", !!process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY);

  if (!results.apiKeyConfigured) {
    console.log("[Paymaster Debug] ERROR: No API key configured");
    return NextResponse.json(results);
  }

  try {
    // Test the paymaster endpoint with correct entrypoint
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
            sender: "0x1234567890123456789012345678901234567890",
            nonce: "0x1",
            initCode: "0x",
            callData: "0x",
            callGasLimit: "0x5208",
            verificationGasLimit: "0x5208",
            preVerificationGas: "0x5208",
            maxFeePerGas: "0x59682f00",
            maxPriorityFeePerGas: "0x59682f00",
          },
          ENTRYPOINT_ADDRESS,
          "0x2105", // Base chainId in hex (8453)
        ],
      }),
    });

    const status = response.status;
    const data = await response.json();

    console.log("[Paymaster Debug] Response status:", status);
    console.log("[Paymaster Debug] Response:", JSON.stringify(data, null, 2));

    // Check results
    if (status === 401) {
      results.error = "API key invalid (401 Unauthorized)";
      console.log("[Paymaster Debug] ERROR: API key is invalid");
    } else if (status === 200) {
      results.apiKeyValid = true;
      results.paymasterResponding = true;

      if (data.error) {
        // API responded but returned an error - this is OK, just means test params were wrong
        console.log("[Paymaster Debug] API key valid, paymaster returned error for test params (expected)");
        console.log("[Paymaster Debug] Error:", data.error.message);
      } else {
        console.log("[Paymaster Debug] SUCCESS: Paymaster fully operational");
      }
    }

    console.log("[Paymaster Debug] ===========================");

    return NextResponse.json({
      ...results,
      httpStatus: status,
      response: data,
    });
  } catch (error) {
    console.error("[Paymaster Debug] Network error:", error);
    results.error = error instanceof Error ? error.message : "Network error";
    return NextResponse.json(results, { status: 500 });
  }
}
