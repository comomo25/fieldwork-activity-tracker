# 開発ガイド

## 🎯 プロジェクト概要

Fieldwork Activity Trackerは、フィールドワークや山行活動を記録・管理するWebアプリケーションです。

## 🔧 開発環境セットアップ

### 必要な環境
- Node.js 18以上
- npm または yarn
- Firebase プロジェクト

### インストール手順

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.localファイルを編集してFirebase設定を追加

# 開発サーバー起動
npm run dev
```

## 📂 プロジェクト構造の説明

### `/app` - Next.js App Router
- `page.tsx` - ホームページ（活動一覧）
- `activities/[id]/` - 個別活動の詳細表示
- `activities/new/` - 新規活動作成フォーム
- `activities/[id]/edit/` - 活動編集フォーム

### `/components` - Reactコンポーネント
- `map-component-main.tsx` - メインの地図表示コンポーネント（Leaflet）
- `elevation-profile.tsx` - 標高プロファイル表示
- `activity-list.tsx` - 活動リスト表示
- `activity-filter.tsx` - 活動フィルター機能
- `ui/` - 共通UIコンポーネント（Radix UI ベース）

### `/lib` - ユーティリティとサービス
- `firebase-service.ts` - Firebase操作のラッパー
- `store.ts` - Zustandによる状態管理
- `types.ts` - TypeScript型定義
- `utils.ts` - ユーティリティ関数

### `/archive` - アーカイブファイル
実験的な実装や古いバージョンのコンポーネントを保管。通常の開発では無視してください。

## 🗂️ 主要機能の実装場所

### 地図機能
- **メインコンポーネント**: `components/map-component-main.tsx`
- **GPXデータ処理**: `lib/utils.ts`内の`parseGPX`関数
- **マーカー管理**: 地図コンポーネント内で管理

### データ管理
- **Firebase操作**: `lib/firebase-service.ts`
- **ローカル状態**: `lib/store.ts`（Zustand）
- **型定義**: `lib/types.ts`

### UI/UX
- **レスポンシブデザイン**: Tailwind CSSクラス
- **フォーム**: Radix UIコンポーネント
- **アニメーション**: Tailwind CSS + カスタムCSS

## 🚀 開発のベストプラクティス

### コード規約
1. **TypeScript**: strictモードを維持
2. **コンポーネント**: 関数コンポーネントを使用
3. **スタイリング**: Tailwind CSSを優先使用
4. **状態管理**: 必要最小限のグローバル状態

### Git運用
```bash
# 機能開発
git checkout -b feature/機能名

# バグ修正
git checkout -b fix/バグ説明

# コミットメッセージ
git commit -m "feat: 新機能の追加"
git commit -m "fix: バグの修正"
git commit -m "docs: ドキュメントの更新"
```

### パフォーマンス最適化
- 地図コンポーネントは動的インポート
- 画像の最適化
- GPXデータの遅延読み込み

## 🐛 デバッグ

### よくある問題と解決方法

#### 地図が表示されない
- Leaflet CSSが正しく読み込まれているか確認
- SSRが無効になっているか確認（`ssr: false`）

#### Firebase接続エラー
- `.env.local`の設定を確認
- Firebaseコンソールでプロジェクト設定を確認

#### ビルドエラー
```bash
# キャッシュクリア
rm -rf .next node_modules
npm install
npm run build
```

## 📝 テスト

```bash
# リント実行
npm run lint

# 型チェック
npx tsc --noEmit

# ビルド確認
npm run build
```

## 🔄 デプロイ

### Vercel（推奨）
1. Vercelにプロジェクトをインポート
2. 環境変数を設定
3. デプロイ

### その他のプラットフォーム
```bash
# ビルド
npm run build

# 静的エクスポート（必要な場合）
npm run export
```

## 📚 参考リソース

- [Next.js Documentation](https://nextjs.org/docs)
- [Leaflet Documentation](https://leafletjs.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Radix UI Documentation](https://www.radix-ui.com/)

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成
3. 変更をコミット
4. プルリクエストを作成

## ❓ ヘルプ

問題が発生した場合は、以下を確認してください：
1. このドキュメント
2. `/archive`内の実験的実装（参考程度）
3. GitHubのIssues