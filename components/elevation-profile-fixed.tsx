'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
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

// Chart.jsの要素を登録
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

interface ElevationProfileFixedProps {
  gpxData?: {
    tracks: Array<{
      points: Array<{
        lat: number
        lng: number
        elevation?: number
        time?: Date
      }>
    }>
  }
  onHoverPoint?: (lat: number, lng: number, distance: number) => void
  hoveredDistance?: number | null
  height?: string
  className?: string
}

export default function ElevationProfileFixed({
  gpxData,
  onHoverPoint,
  hoveredDistance,
  height = '200px',
  className = ''
}: ElevationProfileFixedProps) {
  const chartRef = useRef<ChartJS<'line'>>(null)

  // 距離計算関数
  const calculateDistance = (
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number => {
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

  // チャートデータの準備
  const chartData = useMemo(() => {
    if (!gpxData?.tracks?.[0]?.points || gpxData.tracks[0].points.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: '標高',
          data: [],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 5,
        }]
      }
    }

    const points = gpxData.tracks[0].points
    const distances: number[] = []
    const elevations: number[] = []
    const labels: string[] = []
    let cumulativeDistance = 0

    points.forEach((point, index) => {
      if (index > 0) {
        const prevPoint = points[index - 1]
        const distance = calculateDistance(prevPoint, point)
        cumulativeDistance += distance
      }
      
      distances.push(cumulativeDistance)
      elevations.push(point.elevation || 0)
      labels.push(`${cumulativeDistance.toFixed(2)}km`)
    })

    // デバッグ情報
    console.log('標高プロファイルデータ:', {
      ポイント数: points.length,
      最小標高: Math.min(...elevations),
      最大標高: Math.max(...elevations),
      総距離: cumulativeDistance.toFixed(2) + 'km'
    })

    return {
      labels: labels,
      datasets: [{
        label: '標高',
        data: elevations,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2,
      }]
    }
  }, [gpxData])

  // チャートオプション
  const options: ChartOptions<'line'> = {
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
        font: {
          size: 14
        }
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex
            if (!gpxData?.tracks?.[0]?.points) return ''
            
            let distance = 0
            for (let i = 1; i <= index; i++) {
              const prev = gpxData.tracks[0].points[i - 1]
              const curr = gpxData.tracks[0].points[i]
              distance += calculateDistance(prev, curr)
            }
            return `距離: ${distance.toFixed(2)}km`
          },
          label: (context) => {
            return `標高: ${context.parsed.y.toFixed(0)}m`
          },
          afterLabel: (context) => {
            const index = context.dataIndex
            if (!gpxData?.tracks?.[0]?.points?.[index]) return ''
            
            const point = gpxData.tracks[0].points[index]
            if (point.time) {
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
        title: {
          display: true,
          text: '距離 (km)'
        },
        ticks: {
          callback: function(value, index) {
            // ラベルを間引いて表示
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
        title: {
          display: true,
          text: '標高 (m)'
        },
        ticks: {
          callback: function(value) {
            return value + 'm'
          }
        }
      }
    },
    onHover: (event, activeElements) => {
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
    }
  }

  // データがない場合の表示
  if (!gpxData?.tracks?.[0]?.points || gpxData.tracks[0].points.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg ${className}`}
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
      className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}
      style={{ height }}
    >
      <Line 
        ref={chartRef}
        data={chartData} 
        options={options}
      />
    </div>
  )
}