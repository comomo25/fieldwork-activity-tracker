# UI設計書 実装状況チェックリスト

## 🎯 重要な未実装機能（優先度順）

### 1. 🔴 右サイドバー（フィールドノート）【優先度：高】
- [ ] 右サイドバーのレイアウト実装
- [ ] フィールドノート表示・編集機能
- [ ] サイドバー表示/非表示切り替え
- [ ] 地図エリアの動的拡張
- [ ] アニメーション効果（0.3秒）

### 2. 🔴 写真機能の完全実装【優先度：高】
- [ ] 写真と地図マーカーの双方向連動
- [ ] 写真クリックで地図マーカーハイライト
- [ ] 地図マーカークリックで写真ハイライト
- [ ] 写真のドラッグ&ドロップアップロード
- [ ] EXIF情報から撮影位置自動抽出

### 3. 🟡 レイアウトの動的調整【優先度：中】
- [ ] サイドバー非表示時のレイアウト比率変更
  - 左: 25% → 20%
  - 中央: 45% → 80%
  - 右: 30% → 0%
  - 下部: 70% → 100%
- [ ] スムーズなアニメーション効果

### 4. 🟡 地図コントロールの完全実装【優先度：中】
- [ ] ズームイン/アウトボタン
- [ ] 全体表示ボタン
- [ ] サイドバートグルボタン（📝）
- [ ] コントロールの位置固定（右上）

### 5. 🟢 UI細部の改善【優先度：低】
- [ ] ヘッダーの2層構造
- [ ] メニューボタン（⋮）の実装
- [ ] モーダルウィンドウのデザイン改善
- [ ] 写真削除時の確認ダイアログ
- [ ] 編集中の自動保存機能

## 📊 実装進捗サマリー

| カテゴリ | 実装済み | 未実装 | 進捗率 |
|---------|---------|--------|--------|
| レイアウト | 基本構造 | 右サイドバー、動的調整 | 60% |
| 地図機能 | 表示、切り替え、標高連動 | 写真マーカー連動 | 80% |
| 写真機能 | 基本表示、追加 | 位置連動、EXIF処理 | 50% |
| 編集機能 | 基本編集 | フィールドノート、インライン編集 | 40% |
| UI/UX | 基本操作 | アニメーション、細部調整 | 60% |

**総合進捗率: 約58%**

## 🚀 実装ロードマップ

### Phase 1: コア機能（1-2日）
1. 右サイドバーの実装
2. フィールドノート編集機能
3. サイドバー切り替え機能

### Phase 2: 連動機能（2-3日）
1. 写真-地図マーカー双方向連動
2. EXIF情報処理
3. レイアウト動的調整

### Phase 3: UI改善（1-2日）
1. アニメーション効果
2. 地図コントロール完全実装
3. UI細部の調整

## 🔧 技術的考慮事項

### 状態管理
```typescript
interface UIState {
  rightSidebarVisible: boolean;
  activeTab: 'elevation' | 'photos';
  selectedPhotoId: string | null;
  editMode: 'view' | 'basic' | 'fieldnote';
  mapType: 'standard' | 'satellite';
  layoutMode: 'normal' | 'expanded';
}
```

### レイアウト切り替えアニメーション
```css
.sidebar-transition {
  transition: width 0.3s ease-in-out;
}

.map-area-transition {
  transition: width 0.3s ease-in-out;
}
```

### 写真-地図連動の実装案
```typescript
// 写真クリック時
const handlePhotoClick = (photo: Photo) => {
  if (photo.location) {
    mapRef.current?.flyTo(photo.location, 16);
    highlightMarker(photo.id);
  }
};

// マーカークリック時
const handleMarkerClick = (markerId: string) => {
  setActiveTab('photos');
  scrollToPhoto(markerId);
  highlightPhoto(markerId);
};
```