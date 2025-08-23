import { Loader } from '@googlemaps/js-api-loader'
import type { 
  IMapProvider, 
  LatLng, 
  MapBounds, 
  MapOptions, 
  MapMarkerOptions,
  PolylineOptions,
  MapEvent 
} from '../types'

export class GoogleMapsProvider implements IMapProvider {
  private map: google.maps.Map | null = null
  private markers: Map<string, google.maps.Marker> = new Map()
  private polylines: Map<string, google.maps.Polyline> = new Map()
  private eventListeners: Map<string, google.maps.MapsEventListener[]> = new Map()
  private loader: Loader | null = null
  
  async initialize(container: HTMLElement, options: MapOptions): Promise<void> {
    // コンテナの存在確認
    if (!container || !(container instanceof HTMLElement)) {
      console.error('Map container is not a valid HTML element')
      throw new Error('Invalid map container')
    }

    // Google Maps Loaderの初期化
    this.loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
      libraries: ['places', 'geometry']
    })

    try {
      const google = await this.loader.load()
      
      // 少し待って、DOMが完全に準備されるのを確認
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 地図の作成
      this.map = new google.maps.Map(container, {
        center: options.center,
        zoom: options.zoom,
        mapTypeId: this.convertMapType(options.mapType || 'terrain'),
        disableDefaultUI: options.disableDefaultUI,
        zoomControl: options.zoomControl !== false,
        mapTypeControl: options.mapTypeControl !== false,
        streetViewControl: options.streetViewControl !== false,
        fullscreenControl: options.fullscreenControl !== false,
        gestureHandling: options.gestureHandling || 'auto'
      })
    } catch (error) {
      console.error('Google Maps initialization failed:', error)
      throw error
    }
  }
  
  destroy(): void {
    // イベントリスナーのクリーンアップ
    this.eventListeners.forEach(listeners => {
      listeners.forEach(listener => {
        listener.remove()
      })
    })
    this.eventListeners.clear()
    
    // マーカーとラインのクリア
    this.clearMarkers()
    this.clearPolylines()
    
    // 地図の破棄
    this.map = null
  }
  
  // ビュー操作
  setCenter(center: LatLng, animate = true): void {
    if (!this.map) return
    
    if (animate) {
      this.map.panTo(center)
    } else {
      this.map.setCenter(center)
    }
  }
  
  setZoom(zoom: number): void {
    if (!this.map) return
    this.map.setZoom(zoom)
  }
  
  fitBounds(bounds: MapBounds, padding = 50): void {
    if (!this.map) return
    
    const googleBounds = new google.maps.LatLngBounds(
      { lat: bounds.south, lng: bounds.west },
      { lat: bounds.north, lng: bounds.east }
    )
    
    this.map.fitBounds(googleBounds, padding)
  }
  
  panTo(position: LatLng): void {
    if (!this.map) return
    this.map.panTo(position)
  }
  
  // マーカー操作
  addMarker(options: MapMarkerOptions): string {
    if (!this.map) return ''
    
    const markerId = `marker-${Date.now()}-${Math.random()}`
    
    const marker = new google.maps.Marker({
      position: options.position,
      map: this.map,
      title: options.title,
      draggable: options.draggable || false,
      icon: this.convertIcon(options.icon)
    })
    
    if (options.onClick) {
      marker.addListener('click', options.onClick)
    }
    
    this.markers.set(markerId, marker)
    return markerId
  }
  
  removeMarker(markerId: string): void {
    const marker = this.markers.get(markerId)
    if (marker) {
      marker.setMap(null)
      this.markers.delete(markerId)
    }
  }
  
  updateMarker(markerId: string, options: Partial<MapMarkerOptions>): void {
    const marker = this.markers.get(markerId)
    if (!marker) return
    
    if (options.position) {
      marker.setPosition(options.position)
    }
    if (options.title !== undefined) {
      marker.setTitle(options.title)
    }
    if (options.icon !== undefined) {
      marker.setIcon(this.convertIcon(options.icon))
    }
    if (options.draggable !== undefined) {
      marker.setDraggable(options.draggable)
    }
  }
  
  clearMarkers(): void {
    this.markers.forEach(marker => {
      marker.setMap(null)
    })
    this.markers.clear()
  }
  
  // ライン操作
  addPolyline(options: PolylineOptions): string {
    if (!this.map) return ''
    
    const lineId = `line-${Date.now()}-${Math.random()}`
    
    const polyline = new google.maps.Polyline({
      path: options.path,
      geodesic: options.geodesic !== false,
      strokeColor: options.strokeColor || '#FF0000',
      strokeOpacity: options.strokeOpacity ?? 0.8,
      strokeWeight: options.strokeWeight || 3,
      clickable: options.clickable !== false,
      editable: options.editable || false,
      map: this.map
    })
    
    this.polylines.set(lineId, polyline)
    return lineId
  }
  
  removePolyline(lineId: string): void {
    const polyline = this.polylines.get(lineId)
    if (polyline) {
      polyline.setMap(null)
      this.polylines.delete(lineId)
    }
  }
  
  updatePolyline(lineId: string, options: Partial<PolylineOptions>): void {
    const polyline = this.polylines.get(lineId)
    if (!polyline) return
    
    if (options.path) {
      polyline.setPath(options.path)
    }
    if (options.strokeColor !== undefined) {
      polyline.setOptions({ strokeColor: options.strokeColor })
    }
    if (options.strokeOpacity !== undefined) {
      polyline.setOptions({ strokeOpacity: options.strokeOpacity })
    }
    if (options.strokeWeight !== undefined) {
      polyline.setOptions({ strokeWeight: options.strokeWeight })
    }
    if (options.editable !== undefined) {
      polyline.setEditable(options.editable)
    }
  }
  
  clearPolylines(): void {
    this.polylines.forEach(polyline => {
      polyline.setMap(null)
    })
    this.polylines.clear()
  }
  
  // イベント
  on(event: string, handler: (e: MapEvent) => void): void {
    if (!this.map) return
    
    const googleEventName = this.convertEventName(event)
    const listener = this.map.addListener(googleEventName, (e: any) => {
      const mapEvent: MapEvent = {
        latLng: e.latLng ? { lat: e.latLng.lat(), lng: e.latLng.lng() } : undefined,
        pixel: e.pixel || undefined
      }
      handler(mapEvent)
    })
    
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(listener)
  }
  
  off(event: string, handler?: (e: MapEvent) => void): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => listener.remove())
      this.eventListeners.delete(event)
    }
  }
  
  // 地図タイプ
  setMapType(type: 'roadmap' | 'satellite' | 'terrain' | 'hybrid'): void {
    if (!this.map) return
    this.map.setMapTypeId(this.convertMapType(type))
  }
  
  // ユーティリティ
  getCenter(): LatLng {
    if (!this.map) return { lat: 0, lng: 0 }
    const center = this.map.getCenter()
    return center ? { lat: center.lat(), lng: center.lng() } : { lat: 0, lng: 0 }
  }
  
  getZoom(): number {
    if (!this.map) return 0
    return this.map.getZoom() || 0
  }
  
  getBounds(): MapBounds | null {
    if (!this.map) return null
    const bounds = this.map.getBounds()
    if (!bounds) return null
    
    const ne = bounds.getNorthEast()
    const sw = bounds.getSouthWest()
    
    return {
      north: ne.lat(),
      south: sw.lat(),
      east: ne.lng(),
      west: sw.lng()
    }
  }
  
  pixelToLatLng(pixel: { x: number; y: number }): LatLng | null {
    // Google MapsのOverlayViewを使用して実装が必要
    // 簡易版として null を返す
    return null
  }
  
  latLngToPixel(latLng: LatLng): { x: number; y: number } | null {
    // Google MapsのOverlayViewを使用して実装が必要
    // 簡易版として null を返す
    return null
  }
  
  // ヘルパーメソッド
  private convertMapType(type: string): google.maps.MapTypeId {
    switch (type) {
      case 'satellite': return google.maps.MapTypeId.SATELLITE
      case 'terrain': return google.maps.MapTypeId.TERRAIN
      case 'hybrid': return google.maps.MapTypeId.HYBRID
      default: return google.maps.MapTypeId.ROADMAP
    }
  }
  
  private convertEventName(event: string): string {
    // 一般的なイベント名をGoogle Maps用に変換
    const eventMap: { [key: string]: string } = {
      'move': 'center_changed',
      'zoom': 'zoom_changed',
      'click': 'click',
      'dblclick': 'dblclick',
      'mousemove': 'mousemove',
      'mouseout': 'mouseout',
      'rightclick': 'rightclick'
    }
    return eventMap[event] || event
  }
  
  private convertIcon(icon?: string | any): any {
    if (!icon) return undefined
    if (typeof icon === 'string') return icon
    
    // カスタムアイコンオブジェクトの変換
    return {
      url: icon.url,
      size: icon.size ? new google.maps.Size(icon.size.width, icon.size.height) : undefined,
      anchor: icon.anchor ? new google.maps.Point(icon.anchor.x, icon.anchor.y) : undefined,
      scaledSize: icon.scaledSize ? new google.maps.Size(icon.scaledSize.width, icon.scaledSize.height) : undefined
    }
  }
  
  // 追加の便利メソッド
  async getElevation(points: LatLng[]): Promise<number[]> {
    if (!this.map) return []
    
    const elevator = new google.maps.ElevationService()
    const locations = points.map(p => ({ lat: p.lat, lng: p.lng }))
    
    return new Promise((resolve, reject) => {
      elevator.getElevationForLocations({ locations }, (results, status) => {
        if (status === google.maps.ElevationStatus.OK && results) {
          resolve(results.map(r => r.elevation))
        } else {
          reject(new Error(`Elevation request failed: ${status}`))
        }
      })
    })
  }
  
  // Street View連携
  openStreetView(position: LatLng): void {
    const url = `https://maps.google.com/maps?q=&layer=c&cbll=${position.lat},${position.lng}`
    window.open(url, '_blank')
  }
}