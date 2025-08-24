export interface GPXStats {
  totalDistance: number;  // km
  totalAscent: number;    // m
  totalDescent: number;   // m
  averageGradient: number; // %
  maxElevation: number;   // m
  minElevation: number;   // m
  movingTime: number;     // 分
}

export const calculateGPXStats = (gpxData: any[]): GPXStats | null => {
  if (!gpxData || gpxData.length < 2) return null;

  let totalDistance = 0;
  let totalAscent = 0;
  let totalDescent = 0;
  let maxElevation = -Infinity;
  let minElevation = Infinity;
  let movingTime = 0;

  // 距離と標高の計算
  for (let i = 1; i < gpxData.length; i++) {
    const prev = gpxData[i - 1];
    const curr = gpxData[i];

    // 距離計算（Haversine formula）
    const distance = calculateDistance(
      prev.lat, prev.lng,
      curr.lat, curr.lng
    );
    totalDistance += distance;

    // 標高差計算
    if (prev.elevation && curr.elevation) {
      const elevDiff = curr.elevation - prev.elevation;
      if (elevDiff > 0) {
        totalAscent += elevDiff;
      } else {
        totalDescent += Math.abs(elevDiff);
      }

      maxElevation = Math.max(maxElevation, curr.elevation);
      minElevation = Math.min(minElevation, curr.elevation);
    }

    // 時間計算
    if (prev.time && curr.time) {
      const timeDiff = new Date(curr.time).getTime() - new Date(prev.time).getTime();
      movingTime += timeDiff / 1000 / 60; // 分に変換
    }
  }

  // 平均勾配計算
  const averageGradient = totalDistance > 0 
    ? ((totalAscent - totalDescent) / (totalDistance * 1000)) * 100 
    : 0;

  return {
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalAscent: Math.round(totalAscent),
    totalDescent: Math.round(totalDescent),
    averageGradient: Math.round(averageGradient * 10) / 10,
    maxElevation: maxElevation === -Infinity ? 0 : Math.round(maxElevation),
    minElevation: minElevation === Infinity ? 0 : Math.round(minElevation),
    movingTime: Math.round(movingTime)
  };
};

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}