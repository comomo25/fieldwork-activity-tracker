// 地図プロバイダー共通の型定義

export interface LatLng {
  lat: number
  lng: number
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface MapMarkerOptions {
  position: LatLng
  title?: string
  icon?: string | MarkerIcon
  draggable?: boolean
  onClick?: () => void
}

export interface MarkerIcon {
  url?: string
  size?: { width: number; height: number }
  anchor?: { x: number; y: number }
  scaledSize?: { width: number; height: number }
}

export interface PolylineOptions {
  path: LatLng[]
  strokeColor?: string
  strokeOpacity?: number
  strokeWeight?: number
  geodesic?: boolean
  clickable?: boolean
  editable?: boolean
}

export interface MapOptions {
  center: LatLng
  zoom: number
  mapType?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid'
  disableDefaultUI?: boolean
  zoomControl?: boolean
  mapTypeControl?: boolean
  streetViewControl?: boolean
  fullscreenControl?: boolean
  gestureHandling?: 'cooperative' | 'greedy' | 'none' | 'auto'
}

export interface MapEvent {
  latLng?: LatLng
  pixel?: { x: number; y: number }
}

// 地図プロバイダーインターフェース
export interface IMapProvider {
  // 基本操作
  initialize(container: HTMLElement, options: MapOptions): Promise<void>
  destroy(): void
  
  // ビュー操作
  setCenter(center: LatLng, animate?: boolean): void
  setZoom(zoom: number): void
  fitBounds(bounds: MapBounds, padding?: number): void
  panTo(position: LatLng): void
  
  // マーカー操作
  addMarker(options: MapMarkerOptions): string // マーカーIDを返す
  removeMarker(markerId: string): void
  updateMarker(markerId: string, options: Partial<MapMarkerOptions>): void
  clearMarkers(): void
  
  // ライン操作
  addPolyline(options: PolylineOptions): string // ラインIDを返す
  removePolyline(lineId: string): void
  updatePolyline(lineId: string, options: Partial<PolylineOptions>): void
  clearPolylines(): void
  
  // イベント
  on(event: string, handler: (e: MapEvent) => void): void
  off(event: string, handler?: (e: MapEvent) => void): void
  
  // 地図タイプ
  setMapType(type: 'roadmap' | 'satellite' | 'terrain' | 'hybrid'): void
  
  // ユーティリティ
  getCenter(): LatLng
  getZoom(): number
  getBounds(): MapBounds | null
  pixelToLatLng(pixel: { x: number; y: number }): LatLng | null
  latLngToPixel(latLng: LatLng): { x: number; y: number } | null
}

// GPXデータ型
export interface GPXPoint {
  lat: number
  lon: number
  ele?: number
  time?: string
  distance?: number
}

export interface GPXTrack {
  name?: string
  points: GPXPoint[]
}

export interface GPXData {
  tracks: GPXTrack[]
  waypoints?: GPXPoint[]
  metadata?: {
    name?: string
    desc?: string
    time?: string
  }
}