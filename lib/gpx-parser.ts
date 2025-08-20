import { GPXPoint } from "./types";

export interface GPXParseResult {
  points: GPXPoint[];
  distance: number;
  duration: number;
  elevationGain: number;
  startTime: Date;
  endTime: Date;
}

export function parseGPX(gpxContent: string): GPXParseResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(gpxContent, "text/xml");
  
  const points: GPXPoint[] = [];
  const trackPoints = doc.getElementsByTagName("trkpt");
  
  let totalDistance = 0;
  let totalElevationGain = 0;
  let prevPoint: GPXPoint | null = null;
  let prevElevation: number | null = null;
  let startTime: Date | null = null;
  let endTime: Date | null = null;
  
  for (let i = 0; i < trackPoints.length; i++) {
    const point = trackPoints[i];
    const lat = parseFloat(point.getAttribute("lat") || "0");
    const lng = parseFloat(point.getAttribute("lon") || "0");
    
    const eleNode = point.getElementsByTagName("ele")[0];
    const elevation = eleNode ? parseFloat(eleNode.textContent || "0") : undefined;
    
    const timeNode = point.getElementsByTagName("time")[0];
    const time = timeNode ? new Date(timeNode.textContent || "") : undefined;
    
    if (time) {
      if (!startTime) startTime = time;
      endTime = time;
    }
    
    const gpxPoint: GPXPoint = { lat, lng, elevation, time };
    points.push(gpxPoint);
    
    // 距離計算
    if (prevPoint) {
      totalDistance += calculateDistance(prevPoint, gpxPoint);
    }
    
    // 獲得標高計算
    if (elevation !== undefined && prevElevation !== null) {
      const elevationDiff = elevation - prevElevation;
      if (elevationDiff > 0) {
        totalElevationGain += elevationDiff;
      }
    }
    
    prevPoint = gpxPoint;
    prevElevation = elevation ?? prevElevation;
  }
  
  const duration = startTime && endTime 
    ? Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60) // minutes
    : 0;
  
  return {
    points,
    distance: Math.round(totalDistance * 10) / 10, // km
    duration,
    elevationGain: Math.round(totalElevationGain),
    startTime: startTime || new Date(),
    endTime: endTime || new Date(),
  };
}

function calculateDistance(point1: GPXPoint, point2: GPXPoint): number {
  const R = 6371; // 地球の半径（km）
  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function generateDummyGPX(): string {
  const now = new Date();
  const points = [
    { lat: 35.6586, lng: 138.7454, ele: 3776 },
    { lat: 35.6587, lng: 138.7455, ele: 3770 },
    { lat: 35.6588, lng: 138.7456, ele: 3765 },
    { lat: 35.6589, lng: 138.7457, ele: 3760 },
    { lat: 35.6590, lng: 138.7458, ele: 3755 },
  ];
  
  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="FieldworkApp">
  <trk>
    <name>Sample Track</name>
    <trkseg>\n`;
  
  points.forEach((point, index) => {
    const time = new Date(now.getTime() + index * 60000); // 1分間隔
    gpx += `      <trkpt lat="${point.lat}" lon="${point.lng}">
        <ele>${point.ele}</ele>
        <time>${time.toISOString()}</time>
      </trkpt>\n`;
  });
  
  gpx += `    </trkseg>
  </trk>
</gpx>`;
  
  return gpx;
}