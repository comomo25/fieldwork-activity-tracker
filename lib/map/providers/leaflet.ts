import L from 'leaflet'
import type { 
  IMapProvider, 
  LatLng, 
  MapBounds, 
  MapOptions, 
  MapMarkerOptions,
  PolylineOptions,
  MapEvent 
} from '../types'

export class LeafletProvider implements IMapProvider {
  private map: L.Map | null = null
  private markers: Map<string, L.Marker> = new Map()
  private polylines: Map<string, L.Polyline> = new Map()
  private tileLayer: L.TileLayer | null = null
  private currentMapType: string = 'terrain'
  
  async initialize(container: HTMLElement, options: MapOptions): Promise<void> {
    // Leafletスタイルの読み込み確認
    if (typeof window !== 'undefined' && !document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
      
      // CSSが読み込まれるまで少し待つ
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // 地図の作成
    this.map = L.map(container, {
      center: [options.center.lat, options.center.lng],
      zoom: options.zoom,
      zoomControl: options.zoomControl !== false,
      attributionControl: false
    })
    
    // タイルレイヤーの設定
    this.setMapType(options.mapType || 'terrain')
    
    // Leafletのデフォルトアイコンパス設定
    L.Icon.Default.imagePath = 'https://unpkg.com/leaflet@1.9.4/dist/images/'
  }
  
  destroy(): void {
    if (this.map) {
      this.clearMarkers()
      this.clearPolylines()
      this.map.remove()
      this.map = null
    }
  }
  
  // ビュー操作
  setCenter(center: LatLng, animate = true): void {
    if (!this.map) return
    
    if (animate) {
      this.map.flyTo([center.lat, center.lng])
    } else {
      this.map.setView([center.lat, center.lng])
    }
  }
  
  setZoom(zoom: number): void {
    if (!this.map) return
    this.map.setZoom(zoom)
  }
  
  fitBounds(bounds: MapBounds, padding = 50): void {
    if (!this.map) return
    
    const leafletBounds = L.latLngBounds(
      [bounds.south, bounds.west],
      [bounds.north, bounds.east]
    )
    
    this.map.fitBounds(leafletBounds, { padding: [padding, padding] })
  }
  
  panTo(position: LatLng): void {
    if (!this.map) return
    this.map.panTo([position.lat, position.lng])
  }
  
  // マーカー操作
  addMarker(options: MapMarkerOptions): string {
    if (!this.map) return ''
    
    const markerId = `marker-${Date.now()}-${Math.random()}`
    
    const markerOptions: L.MarkerOptions = {
      title: options.title,
      draggable: options.draggable || false
    }
    
    if (options.icon) {
      markerOptions.icon = this.convertIcon(options.icon)
    }
    
    const marker = L.marker([options.position.lat, options.position.lng], markerOptions)
      .addTo(this.map)
    
    if (options.onClick) {
      marker.on('click', options.onClick)
    }
    
    this.markers.set(markerId, marker)
    return markerId
  }
  
  removeMarker(markerId: string): void {
    const marker = this.markers.get(markerId)
    if (marker && this.map) {
      this.map.removeLayer(marker)
      this.markers.delete(markerId)
    }
  }
  
  updateMarker(markerId: string, options: Partial<MapMarkerOptions>): void {
    const marker = this.markers.get(markerId)
    if (!marker) return
    
    if (options.position) {
      marker.setLatLng([options.position.lat, options.position.lng])
    }
    if (options.icon) {
      marker.setIcon(this.convertIcon(options.icon))
    }
    if (options.draggable !== undefined) {
      if (options.draggable) {
        marker.dragging?.enable()
      } else {
        marker.dragging?.disable()
      }
    }
  }
  
  clearMarkers(): void {
    if (this.map) {
      this.markers.forEach(marker => {
        this.map!.removeLayer(marker)
      })
    }
    this.markers.clear()
  }
  
  // ライン操作
  addPolyline(options: PolylineOptions): string {
    if (!this.map) return ''
    
    const lineId = `line-${Date.now()}-${Math.random()}`
    
    const latLngs = options.path.map(p => [p.lat, p.lng] as L.LatLngExpression)
    
    const polyline = L.polyline(latLngs, {
      color: options.strokeColor || '#FF0000',
      opacity: options.strokeOpacity ?? 0.8,
      weight: options.strokeWeight || 3,
      interactive: options.clickable !== false
    }).addTo(this.map)
    
    this.polylines.set(lineId, polyline)
    return lineId
  }
  
  removePolyline(lineId: string): void {
    const polyline = this.polylines.get(lineId)
    if (polyline && this.map) {
      this.map.removeLayer(polyline)
      this.polylines.delete(lineId)
    }
  }
  
  updatePolyline(lineId: string, options: Partial<PolylineOptions>): void {
    const polyline = this.polylines.get(lineId)
    if (!polyline) return
    
    if (options.path) {
      const latLngs = options.path.map(p => [p.lat, p.lng] as L.LatLngExpression)
      polyline.setLatLngs(latLngs)
    }
    if (options.strokeColor !== undefined) {
      polyline.setStyle({ color: options.strokeColor })
    }
    if (options.strokeOpacity !== undefined) {
      polyline.setStyle({ opacity: options.strokeOpacity })
    }
    if (options.strokeWeight !== undefined) {
      polyline.setStyle({ weight: options.strokeWeight })
    }
  }
  
  clearPolylines(): void {
    if (this.map) {
      this.polylines.forEach(polyline => {
        this.map!.removeLayer(polyline)
      })
    }
    this.polylines.clear()
  }
  
  // イベント
  on(event: string, handler: (e: MapEvent) => void): void {
    if (!this.map) return
    
    const leafletEventName = this.convertEventName(event)
    
    this.map.on(leafletEventName, (e: any) => {
      const mapEvent: MapEvent = {
        latLng: e.latlng ? { lat: e.latlng.lat, lng: e.latlng.lng } : undefined,
        pixel: e.containerPoint ? { x: e.containerPoint.x, y: e.containerPoint.y } : undefined
      }
      handler(mapEvent)
    })
  }
  
  off(event: string, handler?: (e: MapEvent) => void): void {
    if (!this.map) return
    const leafletEventName = this.convertEventName(event)
    this.map.off(leafletEventName)
  }
  
  // 地図タイプ
  setMapType(type: 'roadmap' | 'satellite' | 'terrain' | 'hybrid'): void {
    if (!this.map) return
    
    // 既存のタイルレイヤーを削除
    if (this.tileLayer) {
      this.map.removeLayer(this.tileLayer)
    }
    
    // タイプに応じたタイルレイヤーを設定
    let tileUrl: string
    let maxZoom = 19
    
    switch (type) {
      case 'satellite':
      case 'hybrid':
        // Esri World Imagery
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        break
      case 'terrain':
        // OpenTopoMap
        tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
        maxZoom = 17
        break
      default:
        // OpenStreetMap
        tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    }
    
    this.tileLayer = L.tileLayer(tileUrl, {
      maxZoom,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map)
    
    this.currentMapType = type
  }
  
  // ユーティリティ
  getCenter(): LatLng {
    if (!this.map) return { lat: 0, lng: 0 }
    const center = this.map.getCenter()
    return { lat: center.lat, lng: center.lng }
  }
  
  getZoom(): number {
    if (!this.map) return 0
    return this.map.getZoom()
  }
  
  getBounds(): MapBounds | null {
    if (!this.map) return null
    const bounds = this.map.getBounds()
    
    return {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    }
  }
  
  pixelToLatLng(pixel: { x: number; y: number }): LatLng | null {
    if (!this.map) return null
    const latLng = this.map.containerPointToLatLng([pixel.x, pixel.y])
    return { lat: latLng.lat, lng: latLng.lng }
  }
  
  latLngToPixel(latLng: LatLng): { x: number; y: number } | null {
    if (!this.map) return null
    const point = this.map.latLngToContainerPoint([latLng.lat, latLng.lng])
    return { x: point.x, y: point.y }
  }
  
  // ヘルパーメソッド
  private convertEventName(event: string): string {
    // 一般的なイベント名をLeaflet用に変換
    const eventMap: { [key: string]: string } = {
      'move': 'move',
      'zoom': 'zoomend',
      'click': 'click',
      'dblclick': 'dblclick',
      'mousemove': 'mousemove',
      'mouseout': 'mouseout',
      'rightclick': 'contextmenu'
    }
    return eventMap[event] || event
  }
  
  private convertIcon(icon: string | any): L.Icon {
    if (typeof icon === 'string') {
      return L.icon({
        iconUrl: icon,
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      })
    }
    
    return L.icon({
      iconUrl: icon.url || 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconSize: icon.size ? [icon.size.width, icon.size.height] : [25, 41],
      iconAnchor: icon.anchor ? [icon.anchor.x, icon.anchor.y] : [12, 41],
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      shadowSize: [41, 41]
    })
  }
}