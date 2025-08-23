# Leaflet地図実装のベストプラクティス

## 🗺️ 地図表示の基本チェックリスト

### 必須要件（これを忘れると地図が表示されない）

#### 1. Leaflet CSSのインポート
```javascript
// コンポーネント内で必須
import "leaflet/dist/leaflet.css";
```

```css
/* globals.cssでも追加 */
@import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
```

#### 2. コンテナの高さを明示的に設定
```css
/* 重要: 高さがないと地図が表示されない */
.leaflet-container {
  width: 100% !important;
  height: 100% !important;
  position: relative !important;
}

/* 親要素も高さが必要 */
.map-wrapper {
  height: 100%;
  width: 100%;
}
```

#### 3. MapContainerの注意点
```javascript
// ❌ 間違い：propsは変更されても反映されない
<MapContainer style={{ height: dynamicHeight }} />

// ✅ 正解：keyを使って再レンダリング
<MapContainer key={height} style={{ height: `${height}px` }} />
```

#### 4. 動的インポート（Next.js必須）
```javascript
// SSRエラーを防ぐ
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
```

## 🎯 よくある問題と解決策

### 問題1: 地図が真っ白/部分的にしか表示されない
**原因**: 高さが設定されていない、または初期化タイミングの問題

**解決策**:
```javascript
whenReady={(map) => {
  // サイズを明示的に更新
  setTimeout(() => {
    map.target?.invalidateSize();
  }, 100);
}}
```

### 問題2: マーカーアイコンが404エラー
**原因**: Leafletのデフォルトアイコンパスが間違っている

**解決策**:
```javascript
import("leaflet").then((L) => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
});
```

### 問題3: 地図リサイズ時の表示崩れ
**原因**: Leafletがコンテナサイズの変更を検知できない

**解決策**:
```javascript
// リサイズ時に呼び出す
map.invalidateSize();
```

## 🚀 パフォーマンス最適化

### 1. マーカーの最適化
```javascript
// ❌ 避ける：毎回作成・削除
if (marker) map.removeLayer(marker);
marker = L.marker(position).addTo(map);

// ✅ 推奨：位置を更新
if (!marker) {
  marker = L.marker(position).addTo(map);
} else {
  marker.setLatLng(position);
}
```

### 2. アニメーションの最適化
```javascript
// ❌ 避ける：flyTo（重い）
map.flyTo(position, zoom);

// ✅ 状況に応じて選択
map.setView(position, zoom); // 即座に移動（最速）
map.panTo(position); // 滑らかだが軽い
```

### 3. レンダリング最適化
```css
/* CSS Transitionで滑らかに */
.leaflet-marker-pane > * {
  transition: transform 0.15s ease-out;
}
```

## 📐 レイアウトパターン

### フレックスボックスレイアウト
```jsx
<div className="h-full flex flex-col">
  <div className="flex-1 relative" style={{ minHeight: "400px" }}>
    <MapContainer className="h-full w-full">
      {/* 地図コンテンツ */}
    </MapContainer>
  </div>
</div>
```

### レスポンシブ対応
```javascript
// ビューポートに応じた高さ設定
const getMapHeight = () => {
  if (window.innerWidth < 768) return '300px';
  if (window.innerWidth < 1024) return '400px';
  return '500px';
};
```

## 🔧 デバッグのコツ

### 1. コンソールでの確認
```javascript
// 地図インスタンスの確認
console.log('Map ready:', mapRef.current);
console.log('Container size:', map.getSize());
console.log('Bounds:', map.getBounds());
```

### 2. 開発者ツール
- Network: タイル画像が正しく読み込まれているか
- Elements: `.leaflet-container`の高さを確認
- Console: Leaflet関連のエラーをチェック

## 🎨 カスタマイズ例

### カスタムマーカー
```javascript
const customIcon = L.divIcon({
  className: "custom-marker",
  html: `<div class="pulse-marker"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});
```

### 地図スタイル切り替え
```javascript
// OpenStreetMap
url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

// 衛星写真
url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
```

## ⚡ クイックスタートテンプレート

```jsx
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(
  () => import("react-leaflet").then(mod => mod.MapContainer),
  { ssr: false }
);

export function QuickMap({ points }) {
  return (
    <div className="h-[500px] w-full">
      <MapContainer
        center={[35.681236, 139.767125]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        whenReady={(map) => {
          setTimeout(() => {
            map.target?.invalidateSize();
          }, 100);
        }}
      >
        {/* タイルレイヤーとマーカー */}
      </MapContainer>
    </div>
  );
}
```

## 📚 参考リンク
- [React Leaflet公式](https://react-leaflet.js.org/)
- [Leaflet公式ドキュメント](https://leafletjs.com/reference.html)
- [Next.js動的インポート](https://nextjs.org/docs/advanced-features/dynamic-import)