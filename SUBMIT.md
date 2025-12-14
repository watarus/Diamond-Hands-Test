# Diamond Hands Test

> FUDに耐えてボタンを押し続けろ。あなたの握力をBaseチェーンに刻め。

## 概要

仮想通貨投資家の「握力」を測定するBase Mini App。ボタンを長押しする間、AIが生成したFUDニュースが次々と襲いかかる。60秒以上耐えればDiamond Hands NFT、途中で離したらPaper Hands SBT。結果はフルオンチェーンで永久保存され、Baseチェーン上であなたの握力が証明される。

## デモ

- **アプリURL**: https://diamond-hands-test.vercel.app
- **スライド**: https://docs.google.com/presentation/d/1Q3ixP0sp9yPqF6uIggMa6dfyovZqmZJUfjGPSVCLp0w/edit?usp=sharing
- **デモ動画**: https://drive.google.com/file/d/1JtY3gHAIdAdMmURff41SP4-rAKIiPv_m/view?usp=drive_link

## 推しポイント

### 1. フルオンチェーンNFT - 外部依存ゼロ
- **画像もメタデータも100%コントラクト内に保存**
- IPFSやArweaveに頼らない真の永続性
- SVG画像をオンチェーンで動的生成（プレイ時間・メッセージを反映）
- Diamond Hands = 譲渡可能NFT / Paper Hands = **カスタム_updateで転送をブロックした真のSBT**

### 2. AI駆動のゲーム体験
- **Grok 4.1 Fast** でユニークなFUD/Good Newsを自動生成
- 「ビットコイン大暴落」「SECが全取引所を閉鎖」など臨場感あるヘッドライン
- 60秒超えると一転、祝福メッセージに切り替わる演出
- Vercel Blobで24時間キャッシュ、APIコスト最適化

### 3. Base Mini App ネイティブ体験
- **OnchainKit** でシームレスなウォレット接続
- **Coinbase Paymaster でガス代完全無料** - ユーザーは1円も払わずNFTミント可能
- **Base Builder Attribution (ERC-8021)** 対応
- **動的OG画像生成** - シェア時にプレイ中のFUD/Good Newsメッセージがコントラクトから取得され画像に反映
- Platform-adaptive UI - Base/Farcaster/ブラウザを自動検出、composeCastでネイティブシェア

### 4. 中毒性のあるゲームデザイン
- 序盤は穏やか → 終盤でFUDが激化する緊張感
- 「あと5秒...」の心理的プレッシャー
- NFT/SBTという結果の永続性がプレイヤーを本気にさせる

## 使用技術

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Base/Web3 | **OnchainKit**, **Coinbase Paymaster**, wagmi, viem |
| AI | OpenRouter API (Grok 4.1 Fast), Vercel Blob |
| コントラクト | Solidity (フルオンチェーンSVG NFT), **Base Mainnet** |
| インフラ | Vercel Edge Runtime, dRPC |
| ソーシャル | Farcaster Mini App SDK, Frames |

## コントラクト

- **Address**: `0x9Bb287c1cC354490331385e0213B5B4Ec1a75068`
- **Network**: Base Mainnet
- [Basescan](https://basescan.org/address/0x9Bb287c1cC354490331385e0213B5B4Ec1a75068)

## チームメンバー

- watarus - @watarus

---

*このプロジェクトは「12/13-20 大喜利.hack vibecoding mini hackathon」で作成されました*
