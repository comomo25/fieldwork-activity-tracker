'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createMapProvider, getCurrentMapProvider } from '@/lib/map/map-factory'
import type { IMapProvider, GPXData, LatLng } from '@/lib/map/types'
import { MapIcon, Layers, Mountain, Map as MapIconOutline } from 'lucide-react'

interface UnifiedMapProps {
  gpxData?: GPXData
  hoveredPoint?: LatLng | null
  onHoverPoint?: (lat: number, lng: number, distance: number) => void
  photos?: Array<{
    id: string
    url: string
    location?: { lat: number; lng: number }
    caption?: string
  }>
  className?: string
}

export default function UnifiedMap({ 
  gpxData, 
  hoveredPoint,
  onHoverPoint,
  photos = [],
  className = ''
}: UnifiedMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapProviderRef = useRef<IMapProvider | null>(null)
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'terrain' | 'hybrid'>('terrain')
  const [provider, setProvider] = useState<'google' | 'leaflet'>(getCurrentMapProvider())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const routeLineIdRef = useRef<string | null>(null)
  const hoverMarkerIdRef = useRef<string | null>(null)
  const photoMarkerIdsRef = useRef<string[]>([])

  // 地図の初期化
  useEffect(() => {
    const initMap = async () => {
      // DOMが確実に準備されるまで待つ
      if (!mapContainerRef.current) {
        console.log('Map container not ready yet')
        return
      }

      // コンテナのサイズ確認
      const rect = mapContainerRef.current.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) {
        console.log('Map container has no size, waiting...')
        setTimeout(initMap, 100)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // 既存の地図をクリーンアップ
        if (mapProviderRef.current) {
          mapProviderRef.current.destroy()
        }

        // プロバイダーの作成と初期化
        const mapProvider = await createMapProvider(provider)
        mapProviderRef.current = mapProvider

        // デフォルトの中心位置（東京または GPXデータの最初の点）
        let center: LatLng = { lat: 35.6762, lng: 139.6503 }
        if (gpxData?.tracks?.[0]?.points?.[0]) {
          const firstPoint = gpxData.tracks[0].points[0]
          center = { lat: firstPoint.lat, lng: firstPoint.lon }
        }

        await mapProvider.initialize(mapContainerRef.current, {
          center,
          zoom: 10,
          mapType,
          zoomControl: true,
          streetViewControl: provider === 'google',
          fullscreenControl: true
        })

        // GPXデータの表示
        if (gpxData?.tracks?.[0]?.points) {
          displayGPXRoute(mapProvider, gpxData)
        }

        // 写真マーカーの表示
        if (photos.length > 0) {
          displayPhotoMarkers(mapProvider, photos)
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Map initialization error:', err)
        setError('地図の読み込みに失敗しました')
        setIsLoading(false)
      }
    }

    initMap()
  }, [provider]) // プロバイダー変更時に再初期化

  // GPXルートの表示
  const displayGPXRoute = (mapProvider: IMapProvider, data: GPXData) => {
    const points = data.tracks[0].points
    const path = points.map(p => ({ lat: p.lat, lng: p.lon }))

    // 既存のルートを削除
    if (routeLineIdRef.current) {
      mapProvider.removePolyline(routeLineIdRef.current)
    }

    // 新しいルートを追加
    routeLineIdRef.current = mapProvider.addPolyline({
      path,
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      geodesic: true
    })

    // 地図をルートに合わせる
    if (path.length > 0) {
      const bounds = {
        north: Math.max(...path.map(p => p.lat)),
        south: Math.min(...path.map(p => p.lat)),
        east: Math.max(...path.map(p => p.lng)),
        west: Math.min(...path.map(p => p.lng))
      }
      mapProvider.fitBounds(bounds, 50)
    }

    // マウスイベントの設定
    mapProvider.on('mousemove', (e) => {
      if (onHoverPoint && e.latLng) {
        // 最も近いGPXポイントを見つける
        let minDistance = Infinity
        let closestPoint: any = null

        for (const point of points) {
          const distance = Math.sqrt(
            Math.pow(point.lat - e.latLng.lat, 2) + 
            Math.pow(point.lon - e.latLng.lng, 2)
          )
          if (distance < minDistance && distance < 0.001) { // 閾値内の場合のみ
            minDistance = distance
            closestPoint = point
          }
        }

        if (closestPoint) {
          onHoverPoint(closestPoint.lat, closestPoint.lon, closestPoint.distance || 0)
        }
      }
    })
  }

  // 写真マーカーの表示
  const displayPhotoMarkers = (mapProvider: IMapProvider, photos: any[]) => {
    // 既存のマーカーをクリア
    photoMarkerIdsRef.current.forEach(id => {
      mapProvider.removeMarker(id)
    })
    photoMarkerIdsRef.current = []

    // 新しいマーカーを追加
    photos.forEach(photo => {
      if (photo.location) {
        const markerId = mapProvider.addMarker({
          position: { lat: photo.location.lat, lng: photo.location.lng },
          title: photo.caption || '写真',
          onClick: () => {
            // 写真クリック時の処理
            console.log('Photo clicked:', photo.id)
          }
        })
        photoMarkerIdsRef.current.push(markerId)
      }
    })
  }

  // ホバーポイントの表示
  useEffect(() => {
    if (!mapProviderRef.current) return

    // 既存のホバーマーカーを削除
    if (hoverMarkerIdRef.current) {
      mapProviderRef.current.removeMarker(hoverMarkerIdRef.current)
      hoverMarkerIdRef.current = null
    }

    // 新しいホバーマーカーを追加
    if (hoveredPoint) {
      hoverMarkerIdRef.current = mapProviderRef.current.addMarker({
        position: hoveredPoint,
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
            </svg>
          `),
          size: { width: 20, height: 20 },
          anchor: { x: 10, y: 10 }
        }
      })
    }
  }, [hoveredPoint])

  // 地図タイプの変更
  const handleMapTypeChange = useCallback((type: typeof mapType) => {
    setMapType(type)
    if (mapProviderRef.current) {
      mapProviderRef.current.setMapType(type)
    }
  }, [])

  // プロバイダーの切り替え
  const handleProviderChange = useCallback((newProvider: 'google' | 'leaflet') => {
    if (newProvider !== provider) {
      setProvider(newProvider)
      // 環境変数も更新（次回起動時のため）
      localStorage.setItem('preferredMapProvider', newProvider)
    }
  }, [provider])

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* 地図コンテナ */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* ローディング表示 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">地図を読み込み中...</p>
          </div>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <div className="text-center text-red-600">
            <p className="mb-2">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              再読み込み
            </button>
          </div>
        </div>
      )}

      {/* 地図コントロール */}
      {!isLoading && !error && (
        <>
          {/* 地図タイプ切り替え */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            <button
              onClick={() => handleMapTypeChange('terrain')}
              className={`px-2 py-1 rounded text-xs font-medium shadow-md ${
                mapType === 'terrain' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              title="地形図"
            >
              <Mountain className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleMapTypeChange('roadmap')}
              className={`px-2 py-1 rounded text-xs font-medium shadow-md ${
                mapType === 'roadmap' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              title="道路地図"
            >
              <MapIconOutline className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleMapTypeChange('satellite')}
              className={`px-2 py-1 rounded text-xs font-medium shadow-md ${
                mapType === 'satellite' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              title="衛星写真"
            >
              <Layers className="w-4 h-4" />
            </button>
            {provider === 'google' && (
              <button
                onClick={() => handleMapTypeChange('hybrid')}
                className={`px-2 py-1 rounded text-xs font-medium shadow-md ${
                  mapType === 'hybrid' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
                title="ハイブリッド"
              >
                <MapIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* プロバイダー切り替え（開発環境のみ） */}
          {process.env.NODE_ENV === 'development' && (
            <div className="absolute bottom-2 left-2 bg-white/90 p-2 rounded shadow-md">
              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => handleProviderChange('leaflet')}
                  className={`px-2 py-1 rounded ${
                    provider === 'leaflet' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Leaflet
                </button>
                <button
                  onClick={() => handleProviderChange('google')}
                  className={`px-2 py-1 rounded ${
                    provider === 'google' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                  disabled={!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE'}
                >
                  Google Maps
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Provider: {provider}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}