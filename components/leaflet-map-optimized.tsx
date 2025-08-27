'use client'

import { useEffect, useRef, useState, useCallback, memo } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { 
  COLORS, 
  MAP_CONFIG, 
  TRACK_STYLES, 
  MARKER_STYLES, 
  EARTH_RADIUS_KM,
  DISTANCE_CONFIG 
} from '@/lib/constants'

// Leafletアイコンの修正（一度だけ実行）
if (typeof window !== 'undefined' && !L.Icon.Default.prototype.options.iconUrl) {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

interface GPXPoint {
  lat: number
  lng: number
  elevation?: number
  time?: Date
}

interface GPXTrack {
  points: GPXPoint[]
}

interface GPXData {
  tracks: GPXTrack[]
}

interface LeafletMapOptimizedProps {
  gpxData?: GPXData
  hoveredPoint?: { lat: number; lng: number } | null
  onHoverPoint?: (lat: number, lng: number, distance: number) => void
  height?: string
  className?: string
}

// カスタムアイコンの作成関数
const createCustomIcon = (color: string, size: number, borderWidth: number) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="
      background-color: ${color}; 
      width: ${size}px; 
      height: ${size}px; 
      border-radius: 50%; 
      border: ${borderWidth}px solid white; 
      box-shadow: 0 2px 8px ${color}40;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  })
}

// 距離計算関数
const calculateDistance = (point1: GPXPoint, point2: GPXPoint): number => {
  const dLat = (point2.lat - point1.lat) * Math.PI / 180
  const dLon = (point2.lng - point1.lng) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return EARTH_RADIUS_KM * c
}

const LeafletMapOptimized = memo(({
  gpxData,
  hoveredPoint,
  onHoverPoint,
  height = '400px',
  className = ''
}: LeafletMapOptimizedProps) => {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const polylineLayersRef = useRef<L.Polyline[]>([])
  const markersRef = useRef<L.Marker[]>([])
  const hoverMarkerRef = useRef<L.Marker | null>(null)
  const [mapType, setMapType] = useState<keyof typeof MAP_CONFIG.tileUrls>('satellite')

  // 地図の初期化
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    // 初期位置の決定
    const center = gpxData?.tracks?.[0]?.points?.[0] 
      ? [gpxData.tracks[0].points[0].lat, gpxData.tracks[0].points[0].lng] as [number, number]
      : MAP_CONFIG.defaultCenter
    
    const zoom = gpxData?.tracks?.[0]?.points?.[0] 
      ? MAP_CONFIG.trackZoom 
      : MAP_CONFIG.defaultZoom

    // 地図を初期化
    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: true
    })

    // タイルレイヤーを追加
    L.tileLayer(MAP_CONFIG.tileUrls[mapType], {
      attribution: MAP_CONFIG.attributions[mapType],
      maxZoom: MAP_CONFIG.maxZoom
    }).addTo(map)

    mapRef.current = map

    // 地図のサイズを調整
    setTimeout(() => map.invalidateSize(), 100)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, []) // 初回のみ実行

  // マップタイプの変更
  useEffect(() => {
    if (!mapRef.current) return

    // 既存のタイルレイヤーを削除
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapRef.current?.removeLayer(layer)
      }
    })

    // 新しいタイルレイヤーを追加
    L.tileLayer(MAP_CONFIG.tileUrls[mapType], {
      attribution: MAP_CONFIG.attributions[mapType],
      maxZoom: MAP_CONFIG.maxZoom
    }).addTo(mapRef.current)
  }, [mapType])

  // ポリラインのマウスムーブハンドラー（最適化済み）
  const handlePolylineMouseMove = useCallback((e: L.LeafletMouseEvent, points: GPXPoint[]) => {
    if (!onHoverPoint) return

    const mouseLatLng = e.latlng
    let minDistance = Infinity
    let closestPoint = points[0]
    let closestIndex = 0
    
    // 最も近いポイントを探す
    points.forEach((point, index) => {
      const distance = Math.sqrt(
        Math.pow(point.lat - mouseLatLng.lat, 2) + 
        Math.pow(point.lng - mouseLatLng.lng, 2)
      )
      
      if (distance < minDistance) {
        minDistance = distance
        closestPoint = point
        closestIndex = index
      }
    })
    
    // 近い場合のみコールバックを呼ぶ
    if (minDistance < DISTANCE_CONFIG.hoverThreshold) {
      // 累積距離を計算
      let totalDist = 0
      for (let i = 1; i <= closestIndex; i++) {
        totalDist += calculateDistance(points[i - 1], points[i])
      }
      onHoverPoint(closestPoint.lat, closestPoint.lng, totalDist)
    }
  }, [onHoverPoint])

  // GPXデータの表示
  useEffect(() => {
    if (!mapRef.current || !gpxData?.tracks?.[0]?.points?.length) return

    const points = gpxData.tracks[0].points
    const latLngs = points.map(p => L.latLng(p.lat, p.lng))

    // 既存のレイヤーをクリーンアップ
    polylineLayersRef.current.forEach(layer => mapRef.current?.removeLayer(layer))
    markersRef.current.forEach(marker => mapRef.current?.removeLayer(marker))
    polylineLayersRef.current = []
    markersRef.current = []

    // イルミネーション風のポリラインを作成
    const layers = [
      { color: COLORS.lime.light, ...TRACK_STYLES.glowOuter },
      { color: COLORS.lime.medium, ...TRACK_STYLES.glowMiddle },
      { color: COLORS.lime.primary, ...TRACK_STYLES.glowInner },
      { color: COLORS.lime.lighter, ...TRACK_STYLES.mainTrack }
    ]

    layers.forEach(style => {
      const polyline = L.polyline(latLngs, {
        color: style.color,
        weight: style.weight,
        opacity: style.opacity,
        smoothFactor: 1,
        className: style.className
      }).addTo(mapRef.current!)
      
      polylineLayersRef.current.push(polyline)
      
      // 最後のレイヤーにのみマウスイベントを追加
      if (style.className === 'main-track') {
        polyline.on('mousemove', (e) => handlePolylineMouseMove(e, points))
      }
    })

    // マーカーを追加
    const startMarker = L.marker(latLngs[0], {
      icon: createCustomIcon(COLORS.lime.medium, MARKER_STYLES.start.size, MARKER_STYLES.start.borderWidth),
      title: 'スタート'
    }).addTo(mapRef.current)

    const endMarker = L.marker(latLngs[latLngs.length - 1], {
      icon: createCustomIcon(COLORS.lime.dark, MARKER_STYLES.end.size, MARKER_STYLES.end.borderWidth),
      title: 'ゴール'
    }).addTo(mapRef.current)

    markersRef.current = [startMarker, endMarker]

    // 地図を全体が見えるように調整
    const bounds = L.latLngBounds(latLngs)
    mapRef.current.fitBounds(bounds, { padding: MAP_CONFIG.padding })
  }, [gpxData, handlePolylineMouseMove])

  // ホバーポイントの表示
  useEffect(() => {
    if (!mapRef.current) return

    // 既存のホバーマーカーを削除
    if (hoverMarkerRef.current) {
      mapRef.current.removeLayer(hoverMarkerRef.current)
      hoverMarkerRef.current = null
    }

    // 新しいホバーマーカーを追加
    if (hoveredPoint) {
      const marker = L.marker([hoveredPoint.lat, hoveredPoint.lng], {
        icon: L.divIcon({
          className: 'custom-hover-icon',
          html: `<div style="
            background-color: ${COLORS.lime.light}; 
            width: ${MARKER_STYLES.hover.size}px; 
            height: ${MARKER_STYLES.hover.size}px; 
            border-radius: 50%; 
            border: ${MARKER_STYLES.hover.borderWidth}px solid white; 
            box-shadow: 0 2px 8px ${COLORS.lime.glow}; 
            animation: pulse 1s infinite;
          "></div>`,
          iconSize: [MARKER_STYLES.hover.size, MARKER_STYLES.hover.size],
          iconAnchor: [MARKER_STYLES.hover.size / 2, MARKER_STYLES.hover.size / 2]
        })
      }).addTo(mapRef.current)
      
      hoverMarkerRef.current = marker
    }
  }, [hoveredPoint])

  // マップタイプ切り替えコンポーネント
  const MapTypeSelector = useCallback(() => (
    <div className="absolute top-20 right-4 z-[400] glass-dark rounded-lg p-1 flex gap-1 border border-white/10">
      <button
        onClick={() => setMapType('satellite')}
        className={`px-3 py-1 text-xs rounded transition-all ${
          mapType === 'satellite' 
            ? 'bg-lime-500/30 text-lime-400' 
            : 'text-white/70 hover:bg-white/10'
        }`}
      >
        衛星
      </button>
      <button
        onClick={() => setMapType('standard')}
        className={`px-3 py-1 text-xs rounded transition-all ${
          mapType === 'standard' 
            ? 'bg-lime-500/30 text-lime-400' 
            : 'text-white/70 hover:bg-white/10'
        }`}
      >
        標準
      </button>
    </div>
  ), [mapType])

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div ref={mapContainerRef} className="h-full w-full" />
      <MapTypeSelector />
    </div>
  )
})

LeafletMapOptimized.displayName = 'LeafletMapOptimized'

export default LeafletMapOptimized