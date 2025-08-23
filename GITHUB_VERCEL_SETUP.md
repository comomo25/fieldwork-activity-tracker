# GitHub + Vercel 自動デプロイ設定手順

## 📋 必要な作業

### 1. Vercelトークンの生成
1. https://vercel.com/account/tokens にアクセス
2. 「Create」をクリック
3. トークン名を入力（例：`github-actions`）
4. スコープは「Full Account」を選択
5. 生成されたトークンをコピー

### 2. GitHubリポジトリにシークレットを追加
https://github.com/comomo25/fieldwork-activity-tracker/settings/secrets/actions にアクセスして以下を追加：

| シークレット名 | 値 |
|--------------|---|
| VERCEL_TOKEN | 上記で生成したトークン |
| VERCEL_ORG_ID | team_JqDPDalH4Rxj7B3v5EUL3Or7 |
| VERCEL_PROJECT_ID | prj_K3OfODAaT7z8CSk4PLK4Xp9MxW5R |

### 3. GitHub Actionsの有効化
1. GitHubリポジトリの「Actions」タブを開く
2. 「I understand my workflows, go ahead and enable them」をクリック（表示される場合）

## 🚀 使い方

設定完了後、`main`ブランチにプッシュすると自動的にVercelにデプロイされます。

```bash
git add .
git commit -m "feat: 新機能追加"
git push origin main
```

## 📊 動作確認

1. GitHubの「Actions」タブでワークフローの実行状況を確認
2. 成功すると自動的にVercelにデプロイされる
3. Vercelダッシュボードで新しいデプロイが表示される

## 🔧 トラブルシューティング

### デプロイが失敗する場合
- GitHubのActionsタブでエラーログを確認
- シークレットが正しく設定されているか確認
- Vercelトークンの有効期限を確認

### 代替手段：Vercelダッシュボードから再連携

もしGitHub Actionsを使いたくない場合：

1. https://vercel.com/dashboard にアクセス
2. プロジェクト「fieldwork-app」を選択
3. Settings → Git
4. 「Connect Git Repository」をクリック
5. GitHubアカウントを認証
6. `comomo25/fieldwork-activity-tracker`リポジトリを選択

## 📝 メモ

- GitHub Actionsを使用すると、デプロイプロセスをより細かく制御できます
- プライベートリポジトリでも問題なく動作します
- ビルドログがGitHub上で確認できるため、デバッグが容易です