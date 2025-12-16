import { NextResponse } from "next/server";
import { after } from "next/server";
import OpenAI from "openai";
import { put, list } from "@vercel/blob";
import { FALLBACK_GOOD_NEWS } from "@/lib/fallback-good-news";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const SYSTEM_PROMPT = `あなたは仮想通貨市場の楽観的なニュースヘッドラインを生成する専門家です。
Diamond Hands（60秒以上ボタンを押し続けた勇者）を祝福するニュースを生成します。

以下のルールに従ってください：

1. 必ず日本語で生成すること
2. 短く、ポジティブでインパクトのあるヘッドラインにすること（50文字以内）
3. 投資家を励まし、祝福する内容にすること
4. 絵文字を1-2個含めること（🚀💎🎉✨🌟💰🔥⭐🏆💫🎊🌈💪🥇📈🎯🌙👑🎁💝🔮🏅✈️🌍🎪⚡など）
5. 以下のような内容をバラエティ豊かに含めること：
   - 価格上昇・史上最高値ニュース
   - 機関投資家の参入ニュース
   - 規制の好転ニュース
   - 大企業のBTC購入ニュース
   - プレイヤーを称えるメッセージ
   - 将来の価格予想
   - コミュニティの盛り上がり
   - テクノロジーの進歩ニュース

**重要**: 各ヘッドラインは1行で、番号なしで出力すること。`;

// Blob設定
const BLOB_FILENAME = "good-news-cache.json";
const CACHE_MAX_AGE = 86400 * 1000; // 24時間（ミリ秒）
const BATCH_SIZE = 10;

// インメモリキャッシュ
let memoryCache: { news: string[]; timestamp: number } | null = null;
let isGenerating = false;

/**
 * LLMで大量の良いニュースを生成
 */
async function generateGoodNewsBatch(): Promise<string[]> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.log("No API key, using fallback good news");
    return [...FALLBACK_GOOD_NEWS];
  }

  console.log("Generating 1000 good news from LLM...");

  try {
    const allNews: string[] = [];

    // 10回に分けて100個ずつ生成（合計1000個）
    for (let i = 0; i < 10; i++) {
      const completion = await openai.chat.completions.create({
        model: "x-ai/grok-4.1-fast",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Diamond Handsを祝福するポジティブなニュースヘッドラインを100個生成してください。
それぞれ違う内容で、バラエティ豊かに。1行1ヘッドライン、番号不要。
バッチ${i + 1}/10: ${['価格上昇・史上最高値系', '機関投資家・大企業参入系', 'プレイヤー称賛・握力系', '未来予想・ムーン系', 'コミュニティ・技術進歩系', '規制好転・法整備系', 'ETF・金融商品承認系', 'アダプション・普及系', '技術革新・アップグレード系', 'クジラ買い増し・著名人発言系'][i]}を中心に。`
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

      const news = lines.filter(line => line.length > 10 && line.length < 80); // 80文字に緩和

      console.log(`Good news batch ${i + 1}/10: ${lines.length} lines, ${news.length} after filter`);
      allNews.push(...news);
    }

    console.log(`Total LLM good news: ${allNews.length}`);

    // フォールバックと合わせて重複除去
    const combined = [...new Set([...allNews, ...FALLBACK_GOOD_NEWS])];
    return combined;
  } catch (error) {
    console.error("Good news batch generation error:", error);
    return [...FALLBACK_GOOD_NEWS];
  }
}

/**
 * キャッシュからランダムにN個抽出
 */
function getRandomNews(pool: string[], count: number): string[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Blobからキャッシュ読み込み
 */
async function loadFromBlob(): Promise<{ news: string[]; timestamp: number } | null> {
  try {
    const { blobs } = await list({ prefix: BLOB_FILENAME });
    if (blobs.length === 0) return null;

    const blob = blobs[0];
    const response = await fetch(blob.url);
    if (!response.ok) return null;

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Good news blob read error:", error);
    return null;
  }
}

/**
 * Blobにキャッシュ保存
 */
async function saveToBlob(news: string[]): Promise<void> {
  try {
    const data = { news, timestamp: Date.now() };
    await put(BLOB_FILENAME, JSON.stringify(data), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    console.log(`Good news blob saved: ${news.length} items`);
  } catch (error) {
    console.error("Good news blob write error:", error);
  }
}

/**
 * バックグラウンドで生成してBlobに保存
 */
async function generateAndCacheInBackground() {
  if (isGenerating) return;
  isGenerating = true;

  try {
    const news = await generateGoodNewsBatch();
    if (news.length > 0) {
      await saveToBlob(news);
      memoryCache = { news, timestamp: Date.now() };
    }
  } catch (error) {
    console.error("Good news background generation error:", error);
  } finally {
    isGenerating = false;
  }
}

export async function GET() {
  const now = Date.now();

  try {
    // 1. インメモリキャッシュチェック
    if (memoryCache && (now - memoryCache.timestamp) < CACHE_MAX_AGE) {
      return NextResponse.json({ news: getRandomNews(memoryCache.news, BATCH_SIZE) });
    }

    // 2. Blobからキャッシュ読み込み
    const blobCache = await loadFromBlob();
    if (blobCache && (now - blobCache.timestamp) < CACHE_MAX_AGE) {
      memoryCache = blobCache;
      return NextResponse.json({ news: getRandomNews(blobCache.news, BATCH_SIZE) });
    }

    // 3. キャッシュなし/期限切れ → フォールバック返してバックグラウンド生成
    const fallbackResponse = getRandomNews(FALLBACK_GOOD_NEWS, BATCH_SIZE);

    if (!isGenerating) {
      // after() keeps the function alive after response is sent
      after(async () => {
        console.log("Starting good news background generation via after()");
        await generateAndCacheInBackground();
      });
    }

    return NextResponse.json({ news: fallbackResponse });
  } catch (error) {
    console.error("Good news API error:", error);
    return NextResponse.json({ news: getRandomNews(FALLBACK_GOOD_NEWS, BATCH_SIZE) });
  }
}
