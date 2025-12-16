import { NextResponse } from "next/server";
import { after } from "next/server";
import OpenAI from "openai";
import { put, list } from "@vercel/blob";
import { FALLBACK_FUDS } from "@/lib/fallback-fuds";

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

**重要**: 各ヘッドラインは1行で、番号なしで出力すること。`;

// Blob設定
const BLOB_FILENAME = "fud-cache.json";
const CACHE_MAX_AGE = 86400 * 1000; // 24時間（ミリ秒）
const BATCH_SIZE = 10;

// インメモリキャッシュ（Blob読み込み回数削減）
let memoryCache: { fuds: string[]; timestamp: number } | null = null;
let isGenerating = false;

/**
 * LLMで大量のFUDを生成
 */
async function generateFudBatch(): Promise<string[]> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.log("No API key, using fallback");
    return [...FALLBACK_FUDS];
  }

  console.log("Generating 1000 FUDs from LLM...");

  try {
    const allFuds: string[] = [];

    // 10回に分けて100個ずつ生成（合計1000個）
    for (let i = 0; i < 10; i++) {
      const completion = await openai.chat.completions.create({
        model: "x-ai/grok-4.1-fast",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `仮想通貨の恐怖を煽るニュースヘッドラインを100個生成してください。
それぞれ違う内容で、バラエティ豊かに。1行1ヘッドライン、番号不要。
テーマ「${['価格暴落・市場崩壊系', '規制・法律・禁止系', 'ハッキング・セキュリティ・詐欺系', '取引所・企業倒産系', '技術障害・ネットワーク問題系', 'クジラ売却・大口投げ売り系', '著名人批判・否定発言系', 'ラグプル・スキャム系', '経済危機・リセッション系', '環境問題・エネルギー批判系'][i]}」を中心に100個お願いします。`
          },
        ],
        max_tokens: 8000,
        temperature: 1.0,
      });

      const content = completion.choices[0]?.message?.content?.trim() || "";
      const lines = content
        .split("\n")
        .map(line => line.trim().replace(/^\d+[\.\)]\s*/, "").replace(/^[-•]\s*/, ""))
        .filter(line => line.length > 5); // 空行除去のみ

      const fuds = lines.filter(line => line.length > 10 && line.length < 80); // 80文字に緩和

      console.log(`FUD batch ${i + 1}/10: ${lines.length} lines, ${fuds.length} after filter`);
      allFuds.push(...fuds);
    }

    console.log(`Total LLM FUDs: ${allFuds.length}`);

    // フォールバックと合わせて重複除去
    const combined = [...new Set([...allFuds, ...FALLBACK_FUDS])];
    return combined;
  } catch (error) {
    console.error("FUD batch generation error:", error);
    return [...FALLBACK_FUDS];
  }
}

/**
 * キャッシュからランダムにN個抽出（重複なし）
 */
function getRandomFuds(pool: string[], count: number): string[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Blobからキャッシュ読み込み
 */
async function loadFromBlob(): Promise<{ fuds: string[]; timestamp: number } | null> {
  try {
    const { blobs } = await list({ prefix: BLOB_FILENAME });
    if (blobs.length === 0) return null;

    const blob = blobs[0];
    const response = await fetch(blob.url);
    if (!response.ok) return null;

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Blob read error:", error);
    return null;
  }
}

/**
 * Blobにキャッシュ保存
 */
async function saveToBlob(fuds: string[]): Promise<void> {
  try {
    const data = { fuds, timestamp: Date.now() };
    await put(BLOB_FILENAME, JSON.stringify(data), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    console.log(`Blob saved: ${fuds.length} FUDs`);
  } catch (error) {
    console.error("Blob write error:", error);
  }
}

/**
 * バックグラウンドでFUD生成してBlobに保存
 */
async function generateAndCacheInBackground() {
  if (isGenerating) return;
  isGenerating = true;

  try {
    const fuds = await generateFudBatch();
    if (fuds.length > 0) {
      await saveToBlob(fuds);
      memoryCache = { fuds, timestamp: Date.now() };
    }
  } catch (error) {
    console.error("Background generation error:", error);
  } finally {
    isGenerating = false;
  }
}

export async function GET() {
  const now = Date.now();

  try {
    // 1. インメモリキャッシュチェック
    if (memoryCache && (now - memoryCache.timestamp) < CACHE_MAX_AGE) {
      return NextResponse.json({ fuds: getRandomFuds(memoryCache.fuds, BATCH_SIZE) });
    }

    // 2. Blobからキャッシュ読み込み
    const blobCache = await loadFromBlob();
    if (blobCache && (now - blobCache.timestamp) < CACHE_MAX_AGE) {
      memoryCache = blobCache; // インメモリにも保存
      return NextResponse.json({ fuds: getRandomFuds(blobCache.fuds, BATCH_SIZE) });
    }

    // 3. キャッシュなし/期限切れ → フォールバック返してバックグラウンド生成
    const fallbackResponse = getRandomFuds(FALLBACK_FUDS, BATCH_SIZE);

    if (!isGenerating) {
      // after() keeps the function alive after response is sent
      after(async () => {
        console.log("Starting FUD background generation via after()");
        await generateAndCacheInBackground();
      });
    }

    return NextResponse.json({ fuds: fallbackResponse });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ fuds: getRandomFuds(FALLBACK_FUDS, BATCH_SIZE) });
  }
}
