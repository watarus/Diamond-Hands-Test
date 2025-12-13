# Diamond Hands Test - 開発ガイド

## プロジェクト概要

Base Mini App として動作する握力測定ゲーム。
FUDニュースに耐えながらボタンを押し続け、結果をNFT/SBTとして発行する。

## 技術スタック

- Next.js 14 (App Router)
- OnchainKit + Coinbase Smart Wallet
- Base Mainnet
- OpenRouter API (FUD生成)
- Farcaster Frames

## 重要なドキュメント

### Base Mini App
Mini App の実装・仕様については以下を参照:
https://docs.base.org/mini-apps/llms-full.txt

### OnchainKit
https://onchainkit.xyz/

## コマンド

```bash
pnpm dev        # 開発サーバー (port 3333)
pnpm build      # ビルド
pnpm typecheck  # 型チェック
pnpm lint       # ESLint
```

## ディレクトリ構造

```
src/
├── app/
│   ├── page.tsx              # メインゲーム画面
│   ├── layout.tsx            # レイアウト + メタデータ
│   └── api/
│       ├── fud/route.ts      # FUD生成API (OpenRouter)
│       └── frame/            # Farcaster Frames API
├── components/
│   ├── HoldButton.tsx        # 長押しボタン
│   ├── FudTicker.tsx         # FUDニュース表示
│   ├── Timer.tsx             # タイマー
│   ├── ResultScreen.tsx      # 結果画面
│   └── ConnectWallet.tsx     # ウォレット接続
├── hooks/
│   ├── useGame.ts            # ゲームロジック
│   └── useMint.ts            # NFTミント
├── providers/
│   └── Providers.tsx         # Web3プロバイダー
└── lib/
    └── contracts.ts          # コントラクト設定

contracts/
└── DiamondHands.sol          # NFT/SBTコントラクト

public/
├── .well-known/
│   └── farcaster.json        # Mini App マニフェスト
├── icon.svg                  # アプリアイコン
├── splash.svg                # スプラッシュ画像
└── og-image.svg              # OG画像
```

## 環境変数

```bash
NEXT_PUBLIC_SITE_URL=         # デプロイURL (必須)
NEXT_PUBLIC_ONCHAINKIT_API_KEY=  # OnchainKit API Key
OPENROUTER_API_KEY=           # OpenRouter API Key
NEXT_PUBLIC_WC_PROJECT_ID=    # WalletConnect Project ID
```

## ゲームルール

- 60秒以上ホールド → Diamond Hands NFT (譲渡可能)
- 60秒未満で離す → Paper Hands SBT (譲渡不可)

## Mini App 対応チェックリスト

- [x] OnchainKitProvider 設定
- [x] `.well-known/farcaster.json` マニフェスト
- [x] fc:frame メタタグ
- [x] metadataBase 設定
- [ ] accountAssociation 署名 (デプロイ後に Base Build で生成)
- [ ] コントラクトデプロイ (Base Mainnet)

## 注意事項

- Base Mainnet を使用するため実際のガス代がかかる
- OpenRouter API のレート制限に注意
- マニフェストの署名はデプロイ後に Base Build ツールで生成する
