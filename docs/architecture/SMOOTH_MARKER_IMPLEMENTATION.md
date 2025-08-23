# 滑らかなマーカー移動の実装ガイド

## 概要
標高プロファイル上でマウスを動かした時に、地図上のマーカーが滑らかに軌跡上を移動する機能の実装方法。

## 問題と解決策

### 問題
- Chart.jsの`onHover`イベントはデータポイント単位でしか発火しない
- マーカーが点から点へジャンプして見える
- ポップアップが常に表示されてしまう

### 解決策（3層アプローチ）

#### 1. CSS Transition（基本的な滑らかさ）
```css
/* app/globals.css */
.leaflet-marker-pane > * {
  transition: transform 0.15s ease-out;
}
```

#### 2. Canvas直接監視（正確なマウス位置）
```javascript
// components/elevation-profile.tsx
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const chartArea = chart.chartArea;
  const relativeX = (x - chartArea.left) / (chartArea.right - chartArea.left);
  const interpolatedIndex = relativeX * (points.length - 1);
});
```

#### 3. requestAnimationFrame（滑らかなアニメーション）
```javascript
// components/map-with-elevation-fixed.tsx
const animateMarker = () => {
  // LERP (線形補間)
  const newLat = current[0] + (target[0] - current[0]) * 0.25;
  const newLng = current[1] + (target[1] - current[1]) * 0.25;
  marker.setLatLng([newLat, newLng]);
  requestAnimationFrame(animateMarker);
};
```

#### 4. Catmull-Romスプライン補間（自然な軌跡）
```javascript
// 4点を使用したスプライン曲線で自然な補間
const catmullRom = (p0, p1, p2, p3, t) => {
  return 0.5 * (
    2 * p1 +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t
  );
};
```

## 実装手順

1. **CSS Transitionを追加**
   - `app/globals.css`にマーカーアニメーション用のCSSを追加

2. **Chart.jsのCanvas監視**
   - `elevation-profile.tsx`でmousemoveイベントを直接監視
   - マウス位置から連続的な補間インデックスを計算

3. **requestAnimationFrameループ**
   - `map-with-elevation-fixed.tsx`でアニメーションループを実装
   - LERPで現在位置から目標位置へ滑らかに移動

4. **スプライン補間**
   - GPXポイント間をCatmull-Romスプラインで補間
   - 自然な曲線に沿った移動を実現

## 重要なポイント

- **Chart.jsの制限を回避**: Canvas直接監視でマウス位置を取得
- **パフォーマンス**: requestAnimationFrameで60FPSを維持
- **メモリリーク防止**: クリーンアップ処理を忘れずに
- **エラーハンドリング**: `setActiveElements`の存在確認

## トラブルシューティング

### マーカーが表示されない
- Leaflet CSSが正しくインポートされているか確認
- コンテナの高さが明示的に設定されているか確認

### 動きがカクカクする
- CSS Transitionの値を調整（0.1s〜0.2s）
- LERP係数を調整（0.1〜0.3）

### エラーが発生する
- `setActiveElements`メソッドの存在確認を追加
- インデックスを整数に丸める処理を追加

## 参考リンク
- [Leaflet.marker.slideto](https://www.npmjs.com/package/leaflet.marker.slideto)
- [Chart.js Interactions](https://www.chartjs.org/docs/latest/configuration/interactions.html)
- [Catmull-Rom Spline](https://en.wikipedia.org/wiki/Centripetal_Catmull%E2%80%93Rom_spline)