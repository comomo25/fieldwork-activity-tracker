"use client";

import { useEffect, useRef } from "react";
import { Activity } from "@/lib/types";
import { formatDate, formatDistance } from "@/lib/utils";

interface MapComponentProps {
  activities: Activity[];
  onActivityClick?: (id: string) => void;
}

export function MapComponent({ activities, onActivityClick }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mapContainer.current) return;
    if (mapRef.current) return;

    let isMounted = true;
    let map: any = null;

    const initMap = async () => {
      try {
        // Check if container already has a map
        if (mapContainer.current && (mapContainer.current as any)._leaflet_id) {
          return;
        }

        const L = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");
        
        if (!isMounted || !mapContainer.current) return;
        
        leafletRef.current = L;

        // Fix marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        // Initialize map
        map = L.map(mapContainer.current, {
          center: [35.6762, 139.6503],
          zoom: 6,
        });

        // Add tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        if (isMounted) {
          mapRef.current = map;
        }
      } catch (error) {
        if (error instanceof Error && !error.message.includes("already initialized")) {
          console.error("Map initialization error:", error);
        }
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (map) {
        try {
          map.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !leafletRef.current) return;

    const L = leafletRef.current;
    const map = mapRef.current;

    // Clear existing layers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Polyline || layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    if (activities.length === 0) return;

    const bounds = L.latLngBounds([]);

    // Draw each activity
    activities.forEach((activity, index) => {
      if (!activity.gpxData || activity.gpxData.length === 0) return;

      const latlngs = activity.gpxData.map((point) => [point.lat, point.lng]);
      
      // Draw track
      const polyline = L.polyline(latlngs, {
        color: `hsl(${(index * 360) / activities.length}, 70%, 50%)`,
        weight: 3,
        opacity: 0.7,
      }).addTo(map);

      // Add popup
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

      // Add markers
      if (activity.gpxData[0]) {
        const startPoint = activity.gpxData[0];
        L.marker([startPoint.lat, startPoint.lng])
          .addTo(map)
          .bindPopup(`<strong>${activity.title}</strong><br>開始地点`);
      }

      if (activity.gpxData[activity.gpxData.length - 1]) {
        const endPoint = activity.gpxData[activity.gpxData.length - 1];
        L.marker([endPoint.lat, endPoint.lng])
          .addTo(map)
          .bindPopup(`<strong>${activity.title}</strong><br>終了地点`);
      }

      // Extend bounds
      latlngs.forEach((latlng) => bounds.extend(latlng));
    });

    // Fit bounds
    try {
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch (e) {
      console.error("Error fitting bounds:", e);
    }
  }, [activities, onActivityClick]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
    </div>
  );
}