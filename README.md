# 握力測定 (Diamond Hands Test) 💎🙌

> FUDに耐えてボタンを押し続けろ。あなたの「握力」をBaseチェーンに証明するミニアプリ。

## 概要

画面上のボタンを「長押し」し続ける時間を競う、極めてシンプルな耐久ゲームです。
ただし、ボタンを押している間、画面上には「ビットコイン大暴落」「SECがCoinbaseを提訴」「ウォレットがハッキングされました」といった**偽のFUD（恐怖）ニュース**が大量に流れ、プレイヤーのメンタルを揺さぶり続けます。

- **60秒以上**耐えた勇者には「**Diamond Hands NFT**」
- **60秒未満**で指を離した敗者には「**Paper Hands SBT**（譲渡不可の不名誉な称号）」

結果はFarcaster Framesを通じて即座に共有され、ソーシャルグラフ上で晒されます。

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の変数を設定:

```bash
# OnchainKit API Key (https://portal.cdp.coinbase.com/)
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_api_key

# OpenRouter API Key (https://openrouter.ai/keys)
OPENROUTER_API_KEY=your_api_key

# WalletConnect Project ID (https://cloud.walletconnect.com/)
NEXT_PUBLIC_WC_PROJECT_ID=your_project_id

# Site URL (for Farcaster Frames)
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### 3. 開発サーバーの起動

```bash
pnpm dev
```

http://localhost:3333 でアプリにアクセス。

## Base Mini App 対応

このアプリはBase Mini Appとして動作します。

### マニフェスト設定

`public/.well-known/farcaster.json` にマニフェストファイルがあります。
デプロイ後、以下を更新してください：

1. **accountAssociation**: [Base Build](https://build.base.org) の Account Association ツールで署名を生成
2. **homeUrl, iconUrl など**: 実際のドメインに更新

### 必要なアセット

- `public/icon.svg` - アプリアイコン (512x512)
- `public/splash.svg` - スプラッシュ画像
- `public/og-image.svg` - OG画像 (1200x630)

## スマートコントラクトのデプロイ

### Foundry/Hardhatでデプロイ

`contracts/DiamondHands.sol`をBase Mainnetにデプロイし、
`src/lib/contracts.ts`の`DIAMOND_HANDS_ADDRESS`を更新してください。

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), Tailwind CSS
- **Web3**: OnchainKit, Coinbase Smart Wallet, wagmi, viem
- **チェーン**: Base Mainnet
- **FUD生成**: OpenRouter API
- **ソーシャル**: Farcaster Frames
- **デプロイ**: Vercel

## プロジェクト構造

```
src/
├── app/
│   ├── page.tsx           # メインゲーム画面
│   ├── layout.tsx         # ルートレイアウト
│   └── api/
│       ├── fud/           # FUD生成API (OpenRouter)
│       └── frame/         # Farcaster Frames
├── components/
│   ├── HoldButton.tsx     # メインボタン
│   ├── FudTicker.tsx      # FUDニュース表示
│   ├── Timer.tsx          # タイマー
│   ├── ResultScreen.tsx   # 結果画面
│   └── ConnectWallet.tsx  # ウォレット接続
├── hooks/
│   ├── useGame.ts         # ゲームロジック
│   └── useMint.ts         # NFTミント
├── providers/
│   └── Providers.tsx      # Web3プロバイダー
└── lib/
    └── contracts.ts       # コントラクト設定

contracts/
└── DiamondHands.sol       # NFT/SBTコントラクト
```

## コマンド

```bash
pnpm dev        # 開発サーバー起動 (port 3333)
pnpm build      # プロダクションビルド
pnpm lint       # ESLint実行
pnpm typecheck  # 型チェック
```

---

*このプロジェクトは「12/13-20 大喜利.hack vibecoding mini hackathon」で作成されました*
