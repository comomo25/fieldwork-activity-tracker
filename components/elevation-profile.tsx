"use client";

import { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  TooltipItem,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { GPXPoint } from "@/lib/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ElevationProfileProps {
  points: GPXPoint[];
  onHoverPosition?: (index: number | null) => void;
  highlightedIndex?: number | null;
  height?: string;
  className?: string;
}

export function ElevationProfile({
  points,
  onHoverPosition,
  highlightedIndex,
  height = "200px",
  className = "",
}: ElevationProfileProps) {
  const chartRef = useRef<ChartJS<"line">>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePositionRef = useRef<{ x: number; y: number } | null>(null);

  // 累積距離と標高データを計算
  const [processedData, setProcessedData] = useState<{
    distances: number[];
    elevations: number[];
    labels: string[];
  }>({ distances: [], elevations: [], labels: [] });

  useEffect(() => {
    if (!points || points.length === 0) return;

    const distances: number[] = [];
    const elevations: number[] = [];
    const labels: string[] = [];

    let totalDistance = 0;

    points.forEach((point, index) => {
      if (index > 0) {
        const prevPoint = points[index - 1];
        const distance = calculateDistance(prevPoint, point);
        totalDistance += distance;
      }
      
      distances.push(totalDistance);
      elevations.push(point.elevation || 0);
      labels.push(`${(totalDistance).toFixed(2)} km`);
    });

    console.log("Elevation Profile Data:", { 
      pointsCount: points.length, 
      distances: distances.slice(0, 5), 
      elevations: elevations.slice(0, 5) 
    });

    setProcessedData({ distances, elevations, labels });
  }, [points]);

  // 外部からのハイライト位置を反映
  useEffect(() => {
    if (chartRef.current && highlightedIndex !== null && highlightedIndex !== undefined) {
      const chart = chartRef.current;
      // setActiveElementsが存在するか確認
      if (chart.setActiveElements && typeof chart.setActiveElements === 'function') {
        chart.setActiveElements([
          {
            datasetIndex: 0,
            index: Math.round(highlightedIndex), // 整数に丸める
          },
        ]);
        chart.update();
      }
    }
  }, [highlightedIndex]);

  // Canvasマウスイベントの直接監視
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = chartRef.current;
    const canvas = chart.canvas;
    canvasRef.current = canvas;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // チャートの描画領域内かチェック
      const chartArea = chart.chartArea;
      if (x >= chartArea.left && x <= chartArea.right && 
          y >= chartArea.top && y <= chartArea.bottom) {
        
        // X軸上の位置を計算
        const xScale = chart.scales.x;
        const relativeX = (x - chartArea.left) / (chartArea.right - chartArea.left);
        
        // ポイント数に基づいて補間されたインデックスを計算
        const interpolatedIndex = relativeX * (points.length - 1);
        
        mousePositionRef.current = { x: relativeX, y: 0 };
        setHoveredIndex(interpolatedIndex);
        onHoverPosition?.(interpolatedIndex);
      } else {
        mousePositionRef.current = null;
        setHoveredIndex(null);
        onHoverPosition?.(null);
      }
    };

    const handleMouseLeave = () => {
      mousePositionRef.current = null;
      setHoveredIndex(null);
      onHoverPosition?.(null);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [points, onHoverPosition]);

  const data = {
    labels: processedData.labels,
    datasets: [
      {
        label: "標高",
        data: processedData.elevations,
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        fill: true,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: "rgb(34, 197, 94)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointHoverBackgroundColor: "rgb(34, 197, 94)",
        pointHoverBorderColor: "#fff",
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (items) => {
            if (items.length > 0) {
              const distance = processedData.distances[items[0].dataIndex];
              return `距離: ${distance.toFixed(2)} km`;
            }
            return "";
          },
          label: (item: TooltipItem<"line">) => {
            const elevation = item.parsed.y;
            const index = item.dataIndex;
            const point = points[index];
            
            const labels = [`標高: ${elevation.toFixed(0)} m`];
            
            // 勾配を計算
            if (index > 0) {
              const prevPoint = points[index - 1];
              const distance = calculateDistance(prevPoint, point) * 1000; // m
              const elevationDiff = elevation - (prevPoint.elevation || 0);
              const gradient = distance > 0 ? (elevationDiff / distance) * 100 : 0;
              labels.push(`勾配: ${gradient.toFixed(1)}%`);
            }
            
            return labels;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "距離 (km)",
          color: "#666",
        },
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 8,
          callback: function(value, index) {
            const distance = processedData.distances[index];
            if (distance !== undefined) {
              return distance.toFixed(1);
            }
            return "";
          },
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "標高 (m)",
          color: "#666",
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          callback: function(value) {
            return `${value} m`;
          },
        },
      },
    },
    onHover: () => {
      // Canvasイベントで処理するため、ここでは何もしない
    },
  };

  if (!points || points.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-gray-500">標高データがありません</p>
      </div>
    );
  }

  // 統計情報の計算
  const stats = calculateElevationStats(points, processedData.distances);

  return (
    <div className={className}>
      <div className="bg-white rounded-lg shadow-sm border p-4">
        {/* 統計情報 */}
        <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
          <div>
            <div className="text-gray-500">総距離</div>
            <div className="font-semibold">{stats.totalDistance.toFixed(2)} km</div>
          </div>
          <div>
            <div className="text-gray-500">獲得標高</div>
            <div className="font-semibold">{stats.elevationGain.toFixed(0)} m</div>
          </div>
          <div>
            <div className="text-gray-500">最高地点</div>
            <div className="font-semibold">{stats.maxElevation.toFixed(0)} m</div>
          </div>
          <div>
            <div className="text-gray-500">最低地点</div>
            <div className="font-semibold">{stats.minElevation.toFixed(0)} m</div>
          </div>
        </div>

        {/* グラフ */}
        <div style={{ height }}>
          <Line ref={chartRef} data={data} options={options} />
        </div>

        {/* 現在位置のインジケーター */}
        {hoveredIndex !== null && (
          <div className="mt-2 text-sm text-gray-600">
            現在位置: {processedData.distances[hoveredIndex]?.toFixed(2) || 0} km / 
            標高: {processedData.elevations[hoveredIndex]?.toFixed(0) || 0} m
          </div>
        )}
      </div>
    </div>
  );
}

// 距離計算（GPXパーサーと同じ関数）
function calculateDistance(point1: GPXPoint, point2: GPXPoint): number {
  const R = 6371;
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

// 標高統計の計算
function calculateElevationStats(points: GPXPoint[], distances: number[]) {
  let elevationGain = 0;
  let elevationLoss = 0;
  let maxElevation = -Infinity;
  let minElevation = Infinity;
  
  points.forEach((point, index) => {
    const elevation = point.elevation || 0;
    
    maxElevation = Math.max(maxElevation, elevation);
    minElevation = Math.min(minElevation, elevation);
    
    if (index > 0) {
      const prevElevation = points[index - 1].elevation || 0;
      const diff = elevation - prevElevation;
      
      if (diff > 0) {
        elevationGain += diff;
      } else {
        elevationLoss += Math.abs(diff);
      }
    }
  });
  
  const totalDistance = distances[distances.length - 1] || 0;
  
  return {
    totalDistance,
    elevationGain,
    elevationLoss,
    maxElevation: maxElevation === -Infinity ? 0 : maxElevation,
    minElevation: minElevation === Infinity ? 0 : minElevation,
  };
}