// Google Maps APIユーティリティ関数

/**
 * Google Maps特有の機能
 */

// 標高サービスを使用して標高データを取得
export async function getElevationData(
  path: google.maps.LatLng[],
  maps: typeof google.maps
): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const elevator = new maps.ElevationService()
    
    elevator.getElevationAlongPath(
      {
        path: path,
        samples: Math.min(path.length, 512) // Google APIの制限
      },
      (results, status) => {
        if (status === 'OK' && results) {
          const elevations = results.map(r => r.elevation)
          resolve(elevations)
        } else {
          reject(new Error(`標高データ取得エラー: ${status}`))
        }
      }
    )
  })
}

// 逆ジオコーディング（座標から住所を取得）
export async function reverseGeocode(
  lat: number,
  lng: number,
  maps: typeof google.maps
): Promise<string> {
  return new Promise((resolve, reject) => {
    const geocoder = new maps.Geocoder()
    
    geocoder.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === 'OK' && results?.[0]) {
          resolve(results[0].formatted_address)
        } else {
          reject(new Error(`逆ジオコーディングエラー: ${status}`))
        }
      }
    )
  })
}

// 近くの場所を検索
export async function searchNearbyPlaces(
  lat: number,
  lng: number,
  radius: number,
  type: string,
  map: google.maps.Map
): Promise<google.maps.places.PlaceResult[]> {
  return new Promise((resolve, reject) => {
    const service = new google.maps.places.PlacesService(map)
    
    const request: google.maps.places.PlaceSearchRequest = {
      location: new google.maps.LatLng(lat, lng),
      radius: radius,
      type: type
    }
    
    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        resolve(results)
      } else {
        reject(new Error(`場所検索エラー: ${status}`))
      }
    })
  })
}

// ストリートビューの可用性チェック
export async function checkStreetViewAvailability(
  lat: number,
  lng: number,
  maps: typeof google.maps
): Promise<boolean> {
  return new Promise((resolve) => {
    const streetViewService = new maps.StreetViewService()
    
    streetViewService.getPanorama(
      {
        location: { lat, lng },
        radius: 50
      },
      (data, status) => {
        resolve(status === 'OK')
      }
    )
  })
}

// ルート検索（車、徒歩、自転車など）
export async function calculateRoute(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  travelMode: google.maps.TravelMode,
  maps: typeof google.maps
): Promise<google.maps.DirectionsResult> {
  return new Promise((resolve, reject) => {
    const directionsService = new maps.DirectionsService()
    
    const request: google.maps.DirectionsRequest = {
      origin: start,
      destination: end,
      travelMode: travelMode,
      unitSystem: google.maps.UnitSystem.METRIC,
      avoidHighways: false,
      avoidTolls: false
    }
    
    directionsService.route(request, (result, status) => {
      if (status === 'OK' && result) {
        resolve(result)
      } else {
        reject(new Error(`ルート計算エラー: ${status}`))
      }
    })
  })
}

// ヒートマップ用データ変換
export function convertToHeatmapData(
  points: Array<{ lat: number; lng: number; weight?: number }>
): google.maps.visualization.WeightedLocation[] {
  return points.map(point => ({
    location: new google.maps.LatLng(point.lat, point.lng),
    weight: point.weight || 1
  }))
}

// カスタムマーカークラスター設定
export function getClusterOptions(): any {
  return {
    imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
    gridSize: 60,
    maxZoom: 15,
    minimumClusterSize: 2,
    styles: [
      {
        textColor: 'white',
        url: '',
        height: 52,
        width: 52
      }
    ]
  }
}

// 距離測定（2点間）
export function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371 // 地球の半径（km）
  const dLat = (point2.lat - point1.lat) * Math.PI / 180
  const dLon = (point2.lng - point1.lng) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// トラック全体の距離を計算
export function calculateTotalDistance(
  points: Array<{ lat: number; lng: number }>
): number {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += calculateDistance(points[i - 1], points[i])
  }
  return total
}