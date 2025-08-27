import { EARTH_RADIUS_KM } from '@/lib/constants'

export interface GeoPoint {
  lat: number
  lng: number
}

/**
 * Haversine公式を使用して2点間の距離を計算
 * @param point1 開始地点
 * @param point2 終了地点
 * @returns 距離（キロメートル）
 */
export function calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
  const dLat = (point2.lat - point1.lat) * Math.PI / 180
  const dLon = (point2.lng - point1.lng) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return EARTH_RADIUS_KM * c
}

/**
 * 点の配列から累積距離を計算
 * @param points 座標の配列
 * @returns 各点までの累積距離の配列
 */
export function calculateCumulativeDistances(points: GeoPoint[]): number[] {
  const distances: number[] = [0]
  let cumulative = 0
  
  for (let i = 1; i < points.length; i++) {
    cumulative += calculateDistance(points[i - 1], points[i])
    distances.push(cumulative)
  }
  
  return distances
}

/**
 * マウス位置に最も近い点を見つける
 * @param mousePoint マウスの位置
 * @param points 点の配列
 * @returns 最も近い点のインデックスと距離
 */
export function findClosestPoint(
  mousePoint: GeoPoint, 
  points: GeoPoint[]
): { index: number; distance: number; point: GeoPoint } {
  let minDistance = Infinity
  let closestIndex = 0
  
  points.forEach((point, index) => {
    const distance = Math.sqrt(
      Math.pow(point.lat - mousePoint.lat, 2) + 
      Math.pow(point.lng - mousePoint.lng, 2)
    )
    
    if (distance < minDistance) {
      minDistance = distance
      closestIndex = index
    }
  })
  
  return {
    index: closestIndex,
    distance: minDistance,
    point: points[closestIndex]
  }
}