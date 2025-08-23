'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

interface GoogleMapWrapperProps {
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

export default function GoogleMapWrapper({ 
  gpxData, 
  hoveredPoint,
  onHoverPoint,
  height = '400px',
  className = ''
}: GoogleMapWrapperProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const hoverMarkerRef = useRef<google.maps.Marker | null>(null)
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'terrain' | 'hybrid'>('terrain')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Google Maps初期化
  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
        libraries: ['places', 'geometry', 'elevation']
      })

      try {
        const google = await loader.load()
        
        if (!mapRef.current) return

        // デフォルトの中心位置（東京）
        let defaultCenter = { lat: 35.6762, lng: 139.6503 }
        let defaultZoom = 10

        // GPXデータがある場合は最初の点を中心に
        if (gpxData?.tracks?.[0]?.points?.[0]) {
          const firstPoint = gpxData.tracks[0].points[0]
          defaultCenter = { lat: firstPoint.lat, lng: firstPoint.lng }
          defaultZoom = 14
        }

        // 地図の初期化
        const map = new google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: defaultZoom,
          mapTypeId: mapType,
          streetViewControl: true,
          fullscreenControl: true,
          mapTypeControl: true,
          zoomControl: true,
          scaleControl: true,
          rotateControl: true,
        })

        googleMapRef.current = map

        // GPXデータの描画
        if (gpxData?.tracks?.[0]?.points && gpxData.tracks[0].points.length > 0) {
          const points = gpxData.tracks[0].points
          const path = points.map(p => ({ lat: p.lat, lng: p.lng }))

          // ルートを描画
          const polyline = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: '#FF4444',
            strokeOpacity: 0.8,
            strokeWeight: 3,
            map: map
          })
          polylineRef.current = polyline

          // 始点と終点にマーカー
          const startMarker = new google.maps.Marker({
            position: path[0],
            map: map,
            title: 'スタート',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#00FF00',
              fillOpacity: 0.8,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            }
          })

          const endMarker = new google.maps.Marker({
            position: path[path.length - 1],
            map: map,
            title: 'ゴール',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#FF0000',
              fillOpacity: 0.8,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            }
          })

          markersRef.current = [startMarker, endMarker]

          // 全体が見えるように調整
          const bounds = new google.maps.LatLngBounds()
          path.forEach(p => bounds.extend(p))
          map.fitBounds(bounds)

          // ポリラインクリックイベント
          polyline.addListener('click', (event: google.maps.PolyMouseEvent) => {
            if (event.latLng) {
              const lat = event.latLng.lat()
              const lng = event.latLng.lng()
              
              // 最も近い点を探す
              let minDistance = Infinity
              let closestPoint = points[0]
              let closestIndex = 0
              
              points.forEach((point, index) => {
                const distance = Math.sqrt(
                  Math.pow(point.lat - lat, 2) + Math.pow(point.lng - lng, 2)
                )
                if (distance < minDistance) {
                  minDistance = distance
                  closestPoint = point
                  closestIndex = index
                }
              })

              // 累積距離を計算
              let totalDistance = 0
              for (let i = 1; i <= closestIndex; i++) {
                const prev = points[i - 1]
                const curr = points[i]
                const R = 6371 // 地球の半径（km）
                const dLat = (curr.lat - prev.lat) * Math.PI / 180
                const dLon = (curr.lng - prev.lng) * Math.PI / 180
                const a = 
                  Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(prev.lat * Math.PI / 180) * Math.cos(curr.lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2)
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
                totalDistance += R * c
              }

              if (onHoverPoint) {
                onHoverPoint(closestPoint.lat, closestPoint.lng, totalDistance)
              }
            }
          })
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Google Maps初期化エラー:', err)
        setError('地図の読み込みに失敗しました')
        setIsLoading(false)
      }
    }

    initMap()
  }, [gpxData, mapType])

  // ホバーポイントの表示
  useEffect(() => {
    if (!googleMapRef.current || !window.google) return

    // 既存のホバーマーカーを削除
    if (hoverMarkerRef.current) {
      hoverMarkerRef.current.setMap(null)
      hoverMarkerRef.current = null
    }

    // 新しいホバーマーカーを追加
    if (hoveredPoint) {
      const marker = new google.maps.Marker({
        position: { lat: hoveredPoint.lat, lng: hoveredPoint.lng },
        map: googleMapRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#4285F4',
          fillOpacity: 0.8,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        },
        zIndex: 1000
      })
      hoverMarkerRef.current = marker
    }
  }, [hoveredPoint])

  // マップタイプ切り替え
  const handleMapTypeChange = (type: typeof mapType) => {
    setMapType(type)
    if (googleMapRef.current) {
      googleMapRef.current.setMapTypeId(type)
    }
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Google Maps を読み込み中...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50">
          <div className="text-center text-red-600">
            <p className="font-semibold">エラー</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* マップコンテナ */}
      <div ref={mapRef} className="w-full h-full" />

      {/* マップタイプセレクター */}
      {!isLoading && !error && (
        <div className="absolute top-2 right-2 bg-white rounded-lg shadow-md p-2 z-10">
          <select
            value={mapType}
            onChange={(e) => handleMapTypeChange(e.target.value as typeof mapType)}
            className="text-sm px-2 py-1 border rounded"
          >
            <option value="roadmap">地図</option>
            <option value="satellite">衛星写真</option>
            <option value="terrain">地形</option>
            <option value="hybrid">ハイブリッド</option>
          </select>
        </div>
      )}
    </div>
  )
}