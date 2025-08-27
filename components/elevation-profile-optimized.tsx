'use client'

import { useEffect, useRef, useMemo, memo, useCallback } from 'react'
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
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { COLORS, ELEVATION_CONFIG, EARTH_RADIUS_KM, DISTANCE_CONFIG } from '@/lib/constants'

// Chart.jsの要素を登録（一度だけ実行）
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface GPXPoint {
  lat: number
  lng: number
  elevation?: number
  time?: Date
}

interface GPXTrack {
  points: GPXPoint[]
}

interface GPXData {
  tracks: GPXTrack[]
}

interface ElevationProfileOptimizedProps {
  gpxData?: GPXData
  onHoverPoint?: (lat: number, lng: number, distance: number) => void
  hoveredDistance?: number | null
  height?: string
  className?: string
}

// 距離計算関数をメモ化
const calculateDistance = (point1: GPXPoint, point2: GPXPoint): number => {
  const dLat = (point2.lat - point1.lat) * Math.PI / 180
  const dLon = (point2.lng - point1.lng) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return EARTH_RADIUS_KM * c
}

// プロファイルデータの処理をメモ化
const processProfileData = (points: GPXPoint[]) => {
  const distances: number[] = []
  const elevations: number[] = []
  const labels: string[] = []
  let cumulativeDistance = 0

  points.forEach((point, index) => {
    if (index > 0) {
      const distance = calculateDistance(points[index - 1], point)
      cumulativeDistance += distance
    }
    
    distances.push(cumulativeDistance)
    elevations.push(point.elevation || 0)
    labels.push(`${cumulativeDistance.toFixed(DISTANCE_CONFIG.decimalPlaces)}km`)
  })

  return { distances, elevations, labels, totalDistance: cumulativeDistance }
}

const ElevationProfileOptimized = memo(({
  gpxData,
  onHoverPoint,
  hoveredDistance,
  height = ELEVATION_CONFIG.defaultHeight,
  className = ''
}: ElevationProfileOptimizedProps) => {
  const chartRef = useRef<ChartJS<'line'>>(null)

  // チャートデータの準備（最適化済み）
  const chartData = useMemo(() => {
    if (!gpxData?.tracks?.[0]?.points?.length) {
      return {
        labels: [],
        datasets: [{
          label: '標高',
          data: [],
          borderColor: COLORS.lime.primary,
          backgroundColor: `${COLORS.lime.primary}15`,
          fill: true,
          tension: ELEVATION_CONFIG.animation.tension,
          pointRadius: ELEVATION_CONFIG.animation.pointRadius,
          pointHoverRadius: ELEVATION_CONFIG.animation.pointHoverRadius,
        }]
      }
    }

    const { labels, elevations } = processProfileData(gpxData.tracks[0].points)

    return {
      labels,
      datasets: [{
        label: '標高',
        data: elevations,
        borderColor: COLORS.lime.primary,
        backgroundColor: `${COLORS.lime.primary}26`, // 15% opacity in hex
        fill: true,
        tension: ELEVATION_CONFIG.animation.tension,
        pointRadius: ELEVATION_CONFIG.animation.pointRadius,
        pointHoverRadius: ELEVATION_CONFIG.animation.pointHoverRadius,
        pointBackgroundColor: '#FFFFFF',
        pointBorderColor: COLORS.lime.primary,
        pointBorderWidth: 2,
        borderWidth: ELEVATION_CONFIG.animation.borderWidth,
      }]
    }
  }, [gpxData])

  // ホバーコールバックの最適化
  const handleHover = useCallback((event: any, activeElements: any[]) => {
    if (activeElements.length > 0 && onHoverPoint && gpxData?.tracks?.[0]?.points) {
      const index = activeElements[0].index
      const point = gpxData.tracks[0].points[index]
      
      let distance = 0
      for (let i = 1; i <= index; i++) {
        const prev = gpxData.tracks[0].points[i - 1]
        const curr = gpxData.tracks[0].points[i]
        distance += calculateDistance(prev, curr)
      }
      
      onHoverPoint(point.lat, point.lng, distance)
    }
  }, [gpxData, onHoverPoint])

  // チャートオプション（メモ化）
  const options: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: '標高プロファイル',
        color: 'rgba(255, 255, 255, 0.9)',
        font: {
          size: 12,
          weight: 600 as const,
          family: 'Inter'
        },
        padding: {
          bottom: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 17, 17, 0.95)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        cornerRadius: 8,
        titleFont: {
          size: 13,
          weight: 600 as const
        },
        bodyFont: {
          size: 12
        },
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex
            if (!gpxData?.tracks?.[0]?.points) return ''
            
            const { distances } = processProfileData(gpxData.tracks[0].points)
            return `距離: ${distances[index].toFixed(DISTANCE_CONFIG.decimalPlaces)}km`
          },
          label: (context) => `標高: ${context.parsed.y.toFixed(0)}m`,
          afterLabel: (context) => {
            const index = context.dataIndex
            const point = gpxData?.tracks?.[0]?.points?.[index]
            if (point?.time) {
              const time = new Date(point.time)
              return `時刻: ${time.toLocaleTimeString('ja-JP')}`
            }
            return ''
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        },
        title: {
          display: true,
          text: '距離 (km)',
          color: 'rgba(255, 255, 255, 0.6)',
          font: {
            size: 11,
            weight: 500 as const
          }
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          font: {
            size: 10
          },
          callback: function(value, index) {
            if (index % Math.ceil(this.getLabelForValue(index).length / 10) === 0) {
              const label = this.getLabelForValue(index)
              return label.replace('km', '')
            }
            return ''
          },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10
        }
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        },
        title: {
          display: true,
          text: '標高 (m)',
          color: 'rgba(255, 255, 255, 0.6)',
          font: {
            size: 11,
            weight: 500 as const
          }
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          font: {
            size: 10
          },
          callback: (value) => `${value}m`
        }
      }
    },
    onHover: handleHover
  }), [gpxData, handleHover])

  // データがない場合の表示
  if (!gpxData?.tracks?.[0]?.points?.length) {
    return (
      <div 
        className={`flex items-center justify-center glass-light rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">標高データがありません</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`relative ${className}`}
      style={{ height }}
    >
      <Line 
        ref={chartRef}
        data={chartData} 
        options={options}
      />
    </div>
  )
})

ElevationProfileOptimized.displayName = 'ElevationProfileOptimized'

export default ElevationProfileOptimized