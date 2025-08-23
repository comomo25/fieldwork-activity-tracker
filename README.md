# Fieldwork Activity Tracker

[![Vercel Deployment](https://github.com/comomo25/fieldwork-activity-tracker/actions/workflows/deploy.yml/badge.svg)](https://github.com/comomo25/fieldwork-activity-tracker/actions/workflows/deploy.yml)

フィールドワークや山行活動を記録・管理するWebアプリケーション

## 🚀 機能

- 活動記録の作成・編集・削除
- GPXファイルのアップロードと可視化
- インタラクティブな地図表示（Leaflet）
- 標高プロファイルの表示
- 活動データのFirebase保存
- レスポンシブデザイン

## 📁 プロジェクト構造

```
fieldwork-app/
├── app/                      # Next.js App Router
│   ├── activities/          # 活動関連ページ
│   │   ├── [id]/           # 個別活動詳細
│   │   └── new/            # 新規活動作成
│   ├── globals.css         # グローバルスタイル
│   ├── layout.tsx          # ルートレイアウト
│   └── page.tsx            # ホームページ
├── components/              # Reactコンポーネント
│   ├── ui/                 # UIコンポーネント（Radix UI）
│   ├── activity-filter.tsx # 活動フィルター
│   ├── activity-list.tsx   # 活動リスト
│   ├── elevation-profile.tsx # 標高プロファイル
│   └── map-component-main.tsx # メイン地図コンポーネント
├── lib/                     # ユーティリティ・サービス
│   ├── firebase-service.ts # Firebase操作
│   ├── store.ts            # Zustand状態管理
│   ├── types.ts            # TypeScript型定義
│   └── utils.ts            # ユーティリティ関数
├── archive/                 # アーカイブされたファイル
│   ├── experimental-components/ # 実験的コンポーネント
│   ├── test-pages/         # テストページ
│   └── old-logs/           # 古いログファイル
└── docs/                    # ドキュメント

```

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 15.5 (App Router)
- **言語**: TypeScript 5.9
- **UI**: React 19.1 + Tailwind CSS
- **地図**: Leaflet + React Leaflet
- **状態管理**: Zustand
- **データベース**: Firebase Firestore
- **UIコンポーネント**: Radix UI
- **スタイリング**: Tailwind CSS + CVA

## 🚦 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# リント
npm run lint
```

## 🔧 環境設定

`.env.local`ファイルを作成し、Firebase設定を追加:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## 📝 開発メモ

### 地図コンポーネント
- メインコンポーネント: `map-component-main.tsx`
- Leafletベースの実装
- GPXデータの可視化対応
- マーカーアニメーション機能

### 状態管理
- Zustandによる軽量な状態管理
- 活動データのグローバル管理
- Firebaseとの同期

### パフォーマンス最適化
- 動的インポートによるコード分割
- SSR無効化（地図コンポーネント）
- GPXデータの効率的な処理

## 🎯 今後の開発予定

- [ ] ユーザー認証機能
- [ ] 活動データの統計表示
- [ ] GPXファイルのエクスポート
- [ ] ソーシャル共有機能
- [ ] オフライン対応

## 📄 ライセンス

ISC