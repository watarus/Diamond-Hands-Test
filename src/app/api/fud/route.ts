import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const SYSTEM_PROMPT = `あなたは仮想通貨市場の悲観的なニュースヘッドラインを生成する専門家です。
以下のルールに従ってください：

1. 必ず日本語で生成すること
2. 短く、インパクトのあるヘッドラインにすること（50文字以内）
3. 現実味があり、投資家の恐怖を煽る内容にすること
4. 絵文字を1-2個含めること（🚨⚠️🔴📉💀🔥⛔💸など）
5. 以下のような内容をバラエティ豊かに含めること：
   - 価格暴落ニュース
   - 規制・取り締まりニュース
   - ハッキング・セキュリティニュース
   - 取引所閉鎖・破産ニュース
   - 著名人の否定的発言
   - 技術的問題・障害ニュース
   - ラグプル・詐欺ニュース
   - クジラの大量売却ニュース

**重要**: 各ヘッドラインは1行で、改行で区切って出力すること。`;

// FUDキャッシュ
let fudCache: string[] = [];
let lastGenerated = 0;
const CACHE_DURATION = 60000; // 1分間キャッシュ

const FALLBACK_FUDS = [
  "🚨 速報: ビットコイン、1時間で30%暴落",
  "⚠️ SECがCoinbaseを提訴、全取引所閉鎖の危機",
  "🔴 あなたのウォレットがハッキングされました",
  "📉 イーサリアム創設者が全ETHを売却",
  "💀 Base チェーン、51%攻撃を受ける",
  "🚨 Binanceが破産申請を検討中",
  "⚠️ 米国、仮想通貨全面禁止法案を可決",
  "🔴 Tether、準備金不足で崩壊の兆し",
  "📉 NFT市場、99.9%の価値を失う",
  "💀 主要取引所がハッキングされ全資産流出",
];

async function generateFudBatch(): Promise<string[]> {
  if (!process.env.OPENROUTER_API_KEY) {
    return FALLBACK_FUDS;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "x-ai/grok-4.1-fast",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: "仮想通貨の恐怖を煽るニュースヘッドラインを20個生成してください。それぞれ違う内容で、バラエティ豊かに。1行1ヘッドライン。" },
      ],
      max_tokens: 1000,
      temperature: 1.0,
    });

    const content = completion.choices[0]?.message?.content?.trim() || "";
    const fuds = content
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.includes(""));

    // フォールバックと合わせる
    return fuds.length > 5 ? fuds : [...fuds, ...FALLBACK_FUDS];
  } catch (error) {
    console.error("FUD batch generation error:", error);
    return FALLBACK_FUDS;
  }
}

export async function GET() {
  const now = Date.now();

  // キャッシュが古いか空なら再生成
  if (fudCache.length === 0 || now - lastGenerated > CACHE_DURATION) {
    console.log("Generating new FUD batch...");
    fudCache = await generateFudBatch();
    lastGenerated = now;
    console.log(`Generated ${fudCache.length} FUDs`);
  }

  // ランダムに1つ返す
  const fud = fudCache[Math.floor(Math.random() * fudCache.length)];

  return NextResponse.json({ fud });
}
