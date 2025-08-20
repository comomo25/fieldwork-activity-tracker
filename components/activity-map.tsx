"use client";

import { useEffect, useRef } from "react";
import { Activity } from "@/lib/types";
import { formatDate, formatDistance } from "@/lib/utils";

interface ActivityMapProps {
  activities: Activity[];
  onActivityClick?: (id: string) => void;
}

export function ActivityMap({ activities, onActivityClick }: ActivityMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    // Dynamic import for Leaflet (client-side only)
    import("leaflet").then((L) => {
      import("leaflet/dist/leaflet.css");
      
      // マーカーアイコンの設定
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });

      // 地図の初期化
      const map = L.map(mapContainer.current!).setView([35.6762, 139.6503], 6);
      mapInstance.current = map;

      // タイルレイヤーの追加
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;

    // Dynamic import for Leaflet
    import("leaflet").then((L) => {
      const map = mapInstance.current;

      // 既存のレイヤーをクリア
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Polyline || layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });

      const bounds = L.latLngBounds([]);

      // 各アクティビティの軌跡を描画
      activities.forEach((activity, index) => {
        if (activity.gpxData.length === 0) return;

        const latlngs = activity.gpxData.map((point) => [point.lat, point.lng] as [number, number]);
        
        // 軌跡の描画
        const polyline = L.polyline(latlngs, {
          color: `hsl(${(index * 360) / activities.length}, 70%, 50%)`,
          weight: 3,
          opacity: 0.7,
        }).addTo(map);

        // ポップアップの追加
        polyline.bindPopup(`
          <div>
            <strong>${activity.title}</strong><br>
            ${formatDate(activity.date)}<br>
            距離: ${formatDistance(activity.distance)}
          </div>
        `);

        if (onActivityClick) {
          polyline.on("click", () => onActivityClick(activity.id));
        }

        // 開始地点にマーカーを追加
        const startPoint = activity.gpxData[0];
        const startMarker = L.marker([startPoint.lat, startPoint.lng]).addTo(map);
        startMarker.bindPopup(`<strong>${activity.title}</strong><br>開始地点`);

        // 終了地点にマーカーを追加
        const endPoint = activity.gpxData[activity.gpxData.length - 1];
        const endMarker = L.marker([endPoint.lat, endPoint.lng]).addTo(map);
        endMarker.bindPopup(`<strong>${activity.title}</strong><br>終了地点`);

        // boundsに追加
        latlngs.forEach((latlng) => bounds.extend(latlng));
      });

      // すべての軌跡が表示されるように調整
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    });
  }, [activities, onActivityClick]);

  return <div ref={mapContainer} className="w-full h-[600px] rounded-lg" />;
}