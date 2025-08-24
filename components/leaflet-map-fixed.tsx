'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Leafletアイコンの修正
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface LeafletMapFixedProps {
  gpxData?: {
    tracks: Array<{
      points: Array<{
        lat: number
        lng: number
        elevation?: number
        time?: Date
      }>
    }>
  }
  hoveredPoint?: { lat: number; lng: number } | null
  onHoverPoint?: (lat: number, lng: number, distance: number) => void
  height?: string
  className?: string
}

export default function LeafletMapFixed({
  gpxData,
  hoveredPoint,
  onHoverPoint,
  height = '400px',
  className = ''
}: LeafletMapFixedProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const polylineRef = useRef<L.Polyline | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const hoverMarkerRef = useRef<L.Marker | null>(null)
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'terrain'>('standard')

  // タイルレイヤーのURL設定
  const tileUrls = {
    standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
  }

  const tileAttributions = {
    standard: '© OpenStreetMap contributors',
    satellite: '© Esri',
    terrain: '© OpenTopoMap contributors'
  }

  // 地図の初期化
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    // デフォルトの中心位置
    let center: [number, number] = [35.6762, 139.6503] // 東京
    let zoom = 10

    // GPXデータがある場合は最初の点を中心に
    if (gpxData?.tracks?.[0]?.points?.[0]) {
      const firstPoint = gpxData.tracks[0].points[0]
      center = [firstPoint.lat, firstPoint.lng]
      zoom = 14
    }

    // 地図を初期化
    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: true,
      attributionControl: true
    })

    // タイルレイヤーを追加
    L.tileLayer(tileUrls[mapType], {
      attribution: tileAttributions[mapType],
      maxZoom: 19
    }).addTo(map)

    mapRef.current = map

    // 地図のサイズを調整
    setTimeout(() => {
      map.invalidateSize()
    }, 100)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

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
    L.tileLayer(tileUrls[mapType], {
      attribution: tileAttributions[mapType],
      maxZoom: 19
    }).addTo(mapRef.current)
  }, [mapType])

  // GPXデータの表示
  useEffect(() => {
    if (!mapRef.current || !gpxData?.tracks?.[0]?.points) return

    const points = gpxData.tracks[0].points
    const latLngs: L.LatLng[] = points.map(p => L.latLng(p.lat, p.lng))

    // 既存のポリラインとマーカーを削除
    if (polylineRef.current) {
      mapRef.current.removeLayer(polylineRef.current)
    }
    markersRef.current.forEach(marker => {
      mapRef.current?.removeLayer(marker)
    })
    markersRef.current = []

    // 新しいポリラインを追加
    const polyline = L.polyline(latLngs, {
      color: '#FF4444',
      weight: 3,
      opacity: 0.8,
      smoothFactor: 1
    }).addTo(mapRef.current)
    polylineRef.current = polyline

    // スタートマーカー
    const startMarker = L.marker(latLngs[0], {
      icon: L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #4CAF50; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      }),
      title: 'スタート'
    }).addTo(mapRef.current)

    // ゴールマーカー
    const endMarker = L.marker(latLngs[latLngs.length - 1], {
      icon: L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #F44336; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      }),
      title: 'ゴール'
    }).addTo(mapRef.current)

    markersRef.current = [startMarker, endMarker]

    // 地図を全体が見えるように調整
    const bounds = L.latLngBounds(latLngs)
    mapRef.current.fitBounds(bounds, { padding: [50, 50] })

    // ポリラインにマウスイベントを追加
    if (onHoverPoint) {
      polyline.on('mousemove', (e) => {
        const mouseLatLng = e.latlng
        
        // 最も近いポイントを探す
        let minDistance = Infinity
        let closestPoint = points[0]
        let closestIndex = 0
        let cumulativeDistance = 0
        
        points.forEach((point, index) => {
          if (index > 0) {
            const prev = points[index - 1]
            const R = 6371 // 地球の半径（km）
            const dLat = (point.lat - prev.lat) * Math.PI / 180
            const dLon = (point.lng - prev.lng) * Math.PI / 180
            const a = 
              Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(prev.lat * Math.PI / 180) * Math.cos(point.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
            cumulativeDistance += R * c
          }
          
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
        
        // 累積距離を計算
        let totalDist = 0
        for (let i = 1; i <= closestIndex; i++) {
          const prev = points[i - 1]
          const curr = points[i]
          const R = 6371
          const dLat = (curr.lat - prev.lat) * Math.PI / 180
          const dLon = (curr.lng - prev.lng) * Math.PI / 180
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(prev.lat * Math.PI / 180) * Math.cos(curr.lat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
          totalDist += R * c
        }
        
        if (minDistance < 0.01) { // 近い場合のみ
          onHoverPoint(closestPoint.lat, closestPoint.lng, totalDist)
        }
      })
    }
  }, [gpxData, onHoverPoint])

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
          html: `<div style="background-color: #2196F3; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); animation: pulse 1s infinite;"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        }),
        zIndexOffset: 1000
      }).addTo(mapRef.current)
      hoverMarkerRef.current = marker
    }
  }, [hoveredPoint])

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* マップタイプセレクター - ヘッダーの下に配置 */}
      <div className="absolute top-16 right-4 z-[1000] bg-white rounded-lg shadow-md p-1">
        <select
          value={mapType}
          onChange={(e) => setMapType(e.target.value as typeof mapType)}
          className="text-sm px-2 py-1 border rounded cursor-pointer"
        >
          <option value="standard">標準地図</option>
          <option value="satellite">航空写真</option>
          <option value="terrain">地形図</option>
        </select>
      </div>

      {/* 地図コンテナ */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full"
        style={{ 
          position: 'relative',
          zIndex: 1
        }}
      />

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}