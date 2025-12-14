# Diamond Hands Test

> FUDに耐えてボタンを押し続けろ。あなたの握力をBaseチェーンに刻め。

## 概要

仮想通貨投資家の「握力」を測定するミニゲーム。ボタンを長押しする間、FUD（恐怖・不確実性・疑念）ニュースが次々と流れてくる。60秒以上耐えればDiamond Hands NFT、途中で離したらPaper Hands SBTが発行される。結果はBaseチェーン上にオンチェーンで永久保存。

## デモ

- **アプリURL**: https://diamond-hands-test.vercel.app
- **スライド**: TBD
- **デモ動画**(任意): TBD

## 推しポイント

1. **LLM生成のFUD/Good News**
   - OpenRouter API (Grok) で500+のユニークなFUDニュースと良いニュースを自動生成
   - 24時間キャッシュでコスト最適化

2. **フルオンチェーンNFT**
   - メタデータ・画像すべてコントラクト内に保存（外部依存なし）
   - Diamond Hands = 譲渡可能NFT、Paper Hands = 譲渡不可SBT

3. **Farcaster Mini App対応**
   - Warpcast内で直接プレイ可能
   - フレーム共有でバイラル拡散

## 使用技術

- **フロントエンド**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Web3**: OnchainKit, Coinbase Smart Wallet, viem
- **AI**: OpenRouter API (Grok 4.1), Vercel Blob (キャッシュ)
- **コントラクト**: Solidity, Base Mainnet
- **インフラ**: Vercel Edge Runtime, dRPC

## チームメンバー

- watarus - @watarus

---

*このプロジェクトは「12/13-20 大喜利.hack vibecoding mini hackathon」で作成されました*
