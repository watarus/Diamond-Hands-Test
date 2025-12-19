import { NextResponse } from "next/server";
import OpenAI from "openai";

const ALCHEMY_BASE_URL = `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
const ALCHEMY_NFT_URL = `https://base-mainnet.g.alchemy.com/nft/v3/${process.env.ALCHEMY_API_KEY}`;

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null;
function getOpenAI() {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });
  }
  return openaiClient;
}

interface WalletContext {
  ethBalance: string | null;  // null = 取得失敗
  nftCount: number | null;
  nftNames: string[];
  recentSells: string[];
  tokenBalances: { symbol: string; balance: string }[];
}

async function alchemyRpc(method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(ALCHEMY_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, params, id: 1, jsonrpc: "2.0" }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

async function getWalletContext(address: string): Promise<WalletContext> {
  try {
    // 並列で取得（各APIが失敗しても他に影響しないようにcatch、失敗時はnull）
    const [ethBalanceResult, nftsResult, transfersResult, tokenBalancesResult] = await Promise.all([
      // ETH残高
      alchemyRpc("eth_getBalance", [address, "latest"])
        .then(r => ({ success: true, data: r as string }))
        .catch(() => ({ success: false, data: null })),
      // NFT (REST API)
      fetch(`${ALCHEMY_NFT_URL}/getNFTsForOwner?owner=${address}&pageSize=10`)
        .then(r => r.json())
        .then(data => ({ success: true, data }))
        .catch(() => ({ success: false, data: null })),
      // Asset Transfers
      alchemyRpc("alchemy_getAssetTransfers", [{
        fromAddress: address,
        category: ["erc20", "erc721"],
        maxCount: "0xa",
      }])
        .then(r => ({ success: true, data: r as { transfers: Array<{ asset?: string; from?: string }> } }))
        .catch(() => ({ success: false, data: null })),
      // Token Balances
      alchemyRpc("alchemy_getTokenBalances", [address, "erc20"])
        .then(r => ({ success: true, data: r as { tokenBalances: Array<{ contractAddress: string; tokenBalance: string }> } }))
        .catch(() => ({ success: false, data: null })),
    ]);

    // ETH残高（失敗時はnull）
    const ethBalance = ethBalanceResult.success && ethBalanceResult.data
      ? (Number(BigInt(ethBalanceResult.data)) / 1e18).toFixed(4)
      : null;

    // NFT（失敗時はnull/空配列）
    const nftCount = nftsResult.success && nftsResult.data
      ? (nftsResult.data.totalCount || 0)
      : null;
    const nftNames = nftsResult.success && nftsResult.data?.ownedNfts
      ? nftsResult.data.ownedNfts
          .slice(0, 5)
          .map((nft: { contract?: { name?: string; symbol?: string } }) =>
            nft.contract?.name || nft.contract?.symbol || "Unknown NFT"
          )
          .filter(Boolean)
      : [];

    // Asset Transfers（失敗時は空配列）
    const transfers = transfersResult.success && transfersResult.data?.transfers
      ? transfersResult.data.transfers
      : [];
    const recentSells = transfers
      .filter((t: { from?: string }) => t.from?.toLowerCase() === address.toLowerCase())
      .slice(0, 5)
      .map((t: { asset?: string }) => t.asset || "Unknown");

    // Token Balances（失敗時は空配列）
    const tokensArray = tokenBalancesResult.success && tokenBalancesResult.data?.tokenBalances
      ? tokenBalancesResult.data.tokenBalances
      : [];
    const tokens = tokensArray
      .filter((t: { tokenBalance?: string }) => t.tokenBalance && BigInt(t.tokenBalance) > 0n)
      .slice(0, 5)
      .map((t: { contractAddress: string; tokenBalance: string }) => ({
        symbol: t.contractAddress.slice(0, 8),
        balance: (Number(BigInt(t.tokenBalance || "0")) / 1e18).toFixed(2),
      }));

    return {
      ethBalance,
      nftCount,
      nftNames,
      recentSells,
      tokenBalances: tokens,
    };
  } catch (error) {
    console.error("Wallet context error:", error);
    return {
      ethBalance: null,
      nftCount: null,
      nftNames: [],
      recentSells: [],
      tokenBalances: [],
    };
  }
}

async function generatePersonalizedFud(context: WalletContext): Promise<string[]> {
  if (!process.env.OPENROUTER_API_KEY) {
    return getDefaultPersonalizedFud(context);
  }

  // 取得できたデータのみプロンプトに含める
  const contextLines: string[] = [];
  if (context.ethBalance !== null) {
    contextLines.push(`- ETH残高: ${context.ethBalance} ETH`);
  }
  if (context.nftCount !== null) {
    contextLines.push(`- NFT保有数: ${context.nftCount}個`);
  }
  if (context.nftNames.length > 0) {
    contextLines.push(`- 保有NFT: ${context.nftNames.join(", ")}`);
  }
  if (context.recentSells.length > 0) {
    contextLines.push(`- 最近売却したトークン: ${context.recentSells.join(", ")}`);
  }
  if (context.tokenBalances.length > 0) {
    contextLines.push(`- トークン残高: ${context.tokenBalances.map(t => `${t.symbol}: ${t.balance}`).join(", ")}`);
  }

  // 何も取得できなかったらフォールバック
  if (contextLines.length === 0) {
    return getDefaultPersonalizedFud(context);
  }

  const contextDescription = `プレイヤーのウォレット情報:\n${contextLines.join("\n")}`;

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: "x-ai/grok-4.1-fast",
      messages: [
        {
          role: "system",
          content: `あなたは仮想通貨投資家を煽る天才です。
プレイヤーのウォレット情報を分析して、パーソナライズされた煽りFUDを生成してください。

ルール:
1. 必ず日本語で生成
2. 短く、インパクトのあるメッセージ（40文字以内）
3. プレイヤーのウォレット状況を直接言及して煽る
4. 絵文字を1-2個含める
5. 残高が少なければ「貧乏」系、NFT持ってれば「NFT価値下落」系など、状況に合わせる
6. 1行1メッセージ、番号なし`,
        },
        {
          role: "user",
          content: `${contextDescription}

この情報を使って、このプレイヤー専用の煽りFUDを5個生成してください。`,
        },
      ],
      max_tokens: 500,
      temperature: 1.0,
    });

    const content = completion.choices[0]?.message?.content?.trim() || "";
    const lines = content
      .split("\n")
      .map(line => line.trim().replace(/^\d+[\.\\)]\s*/, "").replace(/^[-•]\s*/, ""))
      .filter(line => line.length > 5 && line.length < 60);

    if (lines.length > 0) {
      return lines.slice(0, 5);
    }
  } catch (error) {
    console.error("LLM generation error:", error);
  }

  return getDefaultPersonalizedFud(context);
}

function getDefaultPersonalizedFud(context: WalletContext): string[] {
  const fuds: string[] = [];

  // ETH残高ベース（取得成功時のみ）
  if (context.ethBalance !== null) {
    const eth = parseFloat(context.ethBalance);
    if (eth < 0.01) {
      fuds.push("💸 ETH残高ほぼゼロ... ガス代も払えないね");
    } else if (eth < 0.1) {
      fuds.push(`💸 ${context.ethBalance} ETH... 微妙な残高だね`);
    } else {
      fuds.push(`📉 ${context.ethBalance} ETH持ってても暴落したら終わりだよ`);
    }
  }

  // NFT保有ベース（取得成功時のみ）
  if (context.nftCount !== null) {
    if (context.nftCount === 0) {
      fuds.push("🖼️ NFT 1個も持ってないの？");
    } else if (context.nftNames.length > 0) {
      fuds.push(`📉 ${context.nftNames[0]}、floor下がってるよ`);
    }
  }

  // 売却履歴ベース
  if (context.recentSells.length > 0) {
    fuds.push(`😱 ${context.recentSells[0]}売ったの？今上がってるけど`);
  }

  // トークン残高ベース
  if (context.tokenBalances.length > 0) {
    fuds.push(`📉 ${context.tokenBalances[0].symbol}、暴落フラグ立ってるよ`);
  }

  // 汎用（データが少ない時の補填）
  const genericFuds = [
    "🤡 またすぐ離すんでしょ？",
    "💀 握力弱そうな顔してるね",
    "😈 お前の負けパターン見えてるよ",
    "🔥 今日も損切りする気？",
    "💩 センスないって言われない？",
  ];

  // 足りない分を汎用FUDで補填
  while (fuds.length < 5 && genericFuds.length > 0) {
    fuds.push(genericFuds.shift()!);
  }

  return fuds.slice(0, 5);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  if (!process.env.ALCHEMY_API_KEY) {
    return NextResponse.json({
      fuds: [
        "🔍 ウォレット分析中... お前の弱さは見えてる",
        "📊 過去の売却履歴、見てるよ",
        "🖼️ NFT持ってても意味ないよ",
      ],
    });
  }

  try {
    const context = await getWalletContext(address);
    const fuds = await generatePersonalizedFud(context);

    return NextResponse.json({ fuds, context });
  } catch (error) {
    console.error("Personalized FUD error:", error);
    return NextResponse.json({
      fuds: ["⚠️ エラーが発生... でもお前は弱い"],
    });
  }
}
