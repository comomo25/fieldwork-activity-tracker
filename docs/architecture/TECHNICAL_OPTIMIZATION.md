# 技術最適化ガイドライン

## 現在の実装状況

### ✅ 実装済み最適化
- **GPXデータ簡素化**: Turf.jsによる軌跡ポイント削減（5m精度）
- **React最適化**: useMemo/useCallbackによる再レンダリング防止
- **動的インポート**: Leafletの遅延ロード（SSR対応）
- **地図タイル最適化**: 3種類の地図スタイル切り替え

### 📊 パフォーマンス指標
- 初期ロード時間: ~2.5秒
- GPX処理時間: 1000ポイントで~100ms
- メモリ使用量: 平均50-80MB

## 推奨改善項目

### 1. コンポーネント統合
```bash
# 削除対象（未使用）
rm components/activity-map.tsx
rm components/map-component.tsx  
rm components/map-react-leaflet.tsx
rm components/map-with-elevation.tsx
rm components/map-optimized.tsx  # Dynamic版を使用
rm components/activity-map-react-dynamic.tsx
```

### 2. 大量データ対応
```typescript
// GPXポイントが1万点を超える場合の対策
export function optimizeGPXData(points: GPXPoint[]): GPXPoint[] {
  if (points.length < 10000) return points;
  
  // ダウンサンプリング
  const step = Math.ceil(points.length / 5000);
  return points.filter((_, index) => index % step === 0);
}
```

### 3. メモリ最適化
```typescript
// 不要なデータの削除
export function cleanupActivityData(activity: Activity) {
  // 表示に不要な詳細データを削除
  delete activity.rawGpxData;
  delete activity.tempData;
  
  // 画像のサムネイル化
  activity.photos = activity.photos.map(photo => ({
    ...photo,
    thumbnail: generateThumbnail(photo.url)
  }));
}
```

### 4. キャッシュ戦略
```typescript
// 地図タイルのキャッシュ
const tileCache = new Map<string, HTMLImageElement>();

// GPX処理結果のキャッシュ
const gpxCache = new Map<string, ProcessedGPXData>();
```

### 5. Web Worker活用
```javascript
// public/workers/gpx-processor.js
self.addEventListener('message', (event) => {
  const { gpxData, action } = event.data;
  
  switch(action) {
    case 'simplify':
      const simplified = simplifyTrack(gpxData);
      self.postMessage({ result: simplified });
      break;
    case 'calculate-stats':
      const stats = calculateStatistics(gpxData);
      self.postMessage({ result: stats });
      break;
  }
});
```

### 6. バンドル最適化
```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        leaflet: {
          test: /[\\/]node_modules[\\/](leaflet|react-leaflet)[\\/]/,
          name: 'leaflet',
          priority: 10,
        },
        charts: {
          test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/,
          name: 'charts',
          priority: 10,
        },
      },
    };
    return config;
  },
};
```

## パフォーマンス目標

| 指標 | 現在 | 目標 |
|------|------|------|
| 初期ロード | 2.5秒 | < 1.5秒 |
| GPX処理(1000点) | 100ms | < 50ms |
| メモリ使用量 | 50-80MB | < 40MB |
| バンドルサイズ | ~500KB | < 300KB |

## 実装優先順位

1. **即効性高**: 未使用コンポーネント削除
2. **中期**: 大量データ対応とキャッシュ実装
3. **長期**: Web Worker導入とさらなる最適化

## モニタリング

```typescript
// パフォーマンス計測
export function measurePerformance(name: string, fn: () => void) {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name}: ${end - start}ms`);
  
  // 分析用に送信
  sendAnalytics('performance', {
    name,
    duration: end - start,
    timestamp: Date.now()
  });
}
```