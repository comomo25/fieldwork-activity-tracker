# 🗺️ 地図・標高プロファイル実装のベストプラクティス

## 📋 目次
1. [地図表示の必須チェックリスト](#地図表示の必須チェックリスト)
2. [標高プロファイルの実装](#標高プロファイルの実装)
3. [よくある問題と解決策](#よくある問題と解決策)
4. [パフォーマンス最適化](#パフォーマンス最適化)

---

## 🗺️ 地図表示の必須チェックリスト

### ✅ Leaflet実装の必須要件

#### 1. **CSS読み込み（最重要）**
```javascript
// コンポーネントの最上部で必須
import "leaflet/dist/leaflet.css";
```

```css
/* globals.cssにも追加 */
@import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');

/* 地図コンテナの高さ設定（必須） */
.leaflet-container {
  width: 100% !important;
  height: 100% !important;
  position: relative !important;
  z-index: 1;
}
```

#### 2. **動的インポート（Next.js）**
```javascript
// SSRエラーを防ぐ
const MapComponent = dynamic(
  () => import('@/components/map-component-main'),
  { 
    ssr: false,
    loading: () => <div>地図を読み込み中...</div>
  }
);
```

#### 3. **高さの明示的設定**
```jsx
// ❌ 間違い：高さが未定義
<div className="map-container">
  <MapContainer />
</div>

// ✅ 正解：高さを明示
<div style={{ height: '500px', width: '100%' }}>
  <MapContainer style={{ height: '100%', width: '100%' }} />
</div>
```

#### 4. **マーカーアイコンの修正**
```javascript
// Leafletのデフォルトアイコンパス問題を解決
useEffect(() => {
  import("leaflet").then((L) => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    });
  });
}, []);
```

---

## 📊 標高プロファイルの実装

### Chart.js設定のベストプラクティス

#### 1. **データ構造の最適化**
```javascript
// GPXデータから標高プロファイル用データを生成
const prepareElevationData = (gpxData) => {
  let cumulativeDistance = 0;
  
  return gpxData.tracks[0].points.map((point, index) => {
    if (index > 0) {
      const prev = gpxData.tracks[0].points[index - 1];
      cumulativeDistance += calculateDistance(prev, point);
    }
    
    return {
      x: cumulativeDistance,
      y: point.elevation || 0,
      lat: point.lat,
      lng: point.lng
    };
  });
};
```

#### 2. **Chart.js最適設定**
```javascript
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => {
          return `標高: ${context.parsed.y.toFixed(0)}m`;
        },
        afterLabel: (context) => {
          return `距離: ${(context.parsed.x / 1000).toFixed(2)}km`;
        }
      }
    }
  },
  scales: {
    x: {
      type: 'linear',
      display: true,
      title: {
        display: true,
        text: '距離 (km)'
      },
      ticks: {
        callback: (value) => (value / 1000).toFixed(1)
      }
    },
    y: {
      type: 'linear',
      display: true,
      title: {
        display: true,
        text: '標高 (m)'
      }
    }
  }
};
```

#### 3. **地図との連動**
```javascript
// 標高プロファイルのホバーと地図マーカーの連動
const handleChartHover = (event, activeElements) => {
  if (activeElements.length > 0) {
    const dataIndex = activeElements[0].index;
    const point = elevationData[dataIndex];
    
    // 地図上にマーカーを表示
    showHoverMarker(point.lat, point.lng);
    
    // イベントを親コンポーネントに伝播
    onHoverPoint?.(point.lat, point.lng, point.x);
  }
};
```

---

## 🐛 よくある問題と解決策

### 問題1: 地図が表示されない・真っ白

**原因と解決策:**

```javascript
// 1. 高さの問題を解決
<div className="h-[500px] w-full"> // Tailwindの場合
  <MapContainer className="h-full w-full" />
</div>

// 2. 初期化タイミングの問題を解決
whenReady={(map) => {
  setTimeout(() => {
    map.target?.invalidateSize();
  }, 100);
}}

// 3. CSS読み込みの確認
import "leaflet/dist/leaflet.css"; // 必須！
```

### 問題2: マーカーが404エラー

**解決策:**
```bash
# publicフォルダに画像を配置
mkdir -p public/leaflet
cp node_modules/leaflet/dist/images/* public/leaflet/
```

### 問題3: 標高プロファイルが表示されない

**チェックポイント:**
```javascript
// 1. データの存在確認
console.log('Elevation data:', gpxData.tracks[0].points[0].elevation);

// 2. Chart.jsの動的インポート
const Chart = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Line),
  { ssr: false }
);

// 3. 必要なChart.js要素の登録
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
```

### 問題4: GPXデータの処理エラー

**データ検証と修正:**
```javascript
// GPXデータの検証
const validateGPXData = (gpxData) => {
  if (!gpxData?.tracks?.[0]?.points) {
    console.error('Invalid GPX structure');
    return false;
  }
  
  // 座標の有効性チェック
  const validPoints = gpxData.tracks[0].points.filter(point => {
    const lat = parseFloat(point.lat);
    const lng = parseFloat(point.lng);
    return !isNaN(lat) && !isNaN(lng) && 
           lat >= -90 && lat <= 90 && 
           lng >= -180 && lng <= 180;
  });
  
  gpxData.tracks[0].points = validPoints;
  return validPoints.length > 0;
};
```

---

## ⚡ パフォーマンス最適化

### 1. **GPXデータの最適化**
```javascript
import simplify from '@turf/simplify';

// 大量のポイントを簡素化
const optimizeGPXData = (points) => {
  if (points.length < 1000) return points;
  
  // Turf.jsで簡素化
  const lineString = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: points.map(p => [p.lng, p.lat, p.elevation])
    }
  };
  
  const simplified = simplify(lineString, {
    tolerance: 0.0001,
    highQuality: true
  });
  
  return simplified.geometry.coordinates.map(coord => ({
    lat: coord[1],
    lng: coord[0],
    elevation: coord[2]
  }));
};
```

### 2. **メモ化による再レンダリング防止**
```javascript
const MemoizedMap = React.memo(MapComponent, (prevProps, nextProps) => {
  // GPXデータが変わらない限り再レンダリングしない
  return JSON.stringify(prevProps.gpxData) === JSON.stringify(nextProps.gpxData);
});

// 計算結果のキャッシュ
const elevationData = useMemo(() => {
  if (!gpxData) return [];
  return prepareElevationData(gpxData);
}, [gpxData]);
```

### 3. **遅延読み込みとコード分割**
```javascript
// 地図コンポーネントの遅延読み込み
const MapComponent = lazy(() => 
  import(/* webpackChunkName: "map" */ './map-component')
);

// 標高プロファイルの遅延読み込み
const ElevationProfile = lazy(() => 
  import(/* webpackChunkName: "elevation" */ './elevation-profile')
);
```

### 4. **デバウンスによる処理軽減**
```javascript
import { debounce } from 'lodash';

// マウス移動イベントのデバウンス
const handleMouseMove = useMemo(
  () => debounce((lat, lng, distance) => {
    onHoverPoint?.(lat, lng, distance);
  }, 50),
  [onHoverPoint]
);
```

---

## 🔧 デバッグのコツ

### コンソールでの確認項目
```javascript
// 1. 地図の初期化確認
console.log('Map container:', mapContainerRef.current);
console.log('Container size:', {
  width: mapContainerRef.current?.offsetWidth,
  height: mapContainerRef.current?.offsetHeight
});

// 2. GPXデータの確認
console.log('GPX points count:', gpxData?.tracks[0]?.points?.length);
console.log('First point:', gpxData?.tracks[0]?.points[0]);
console.log('Has elevation:', gpxData?.tracks[0]?.points[0]?.elevation);

// 3. Chart.jsデータの確認
console.log('Chart data:', chartData);
console.log('Chart options:', chartOptions);
```

### ブラウザ開発者ツール
- **Network**: タイル画像、マーカー画像の読み込み確認
- **Elements**: `.leaflet-container`の高さ確認
- **Console**: エラーメッセージの確認
- **Performance**: レンダリング性能の測定

---

## 📚 参考リソース

- [React Leaflet公式ドキュメント](https://react-leaflet.js.org/)
- [Chart.js公式ドキュメント](https://www.chartjs.org/docs/latest/)
- [Turf.js（地理空間解析）](https://turfjs.org/)
- [Next.js動的インポート](https://nextjs.org/docs/advanced-features/dynamic-import)

## 💡 クイックスタート

問題解決の優先順位：
1. **CSS読み込み確認** → 地図が表示されない主因
2. **高さ設定確認** → コンテナに明示的な高さ
3. **動的インポート** → SSRエラーの解決
4. **データ検証** → GPXデータの構造確認

これらを順番に確認することで、ほとんどの表示問題は解決できます。