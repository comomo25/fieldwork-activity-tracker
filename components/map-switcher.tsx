'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Map, Globe } from 'lucide-react'

// 動的インポート
const LeafletMap = dynamic(
  () => import('@/components/map-component-main'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Leaflet マップを読み込み中...</p>
        </div>
      </div>
    )
  }
)

const GoogleMap = dynamic(
  () => import('@/components/google-map-wrapper'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Google Maps を読み込み中...</p>
        </div>
      </div>
    )
  }
)

interface MapSwitcherProps {
  gpxData?: any
  hoveredPoint?: { lat: number; lng: number } | null
  onHoverPoint?: (lat: number, lng: number, distance: number) => void
  height?: string
  className?: string
  defaultProvider?: 'leaflet' | 'google'
}

export default function MapSwitcher({
  gpxData,
  hoveredPoint,
  onHoverPoint,
  height = '400px',
  className = '',
  defaultProvider = 'leaflet'
}: MapSwitcherProps) {
  const [activeProvider, setActiveProvider] = useState(defaultProvider)

  return (
    <div className={className}>
      <Tabs value={activeProvider} onValueChange={(v) => setActiveProvider(v as typeof activeProvider)}>
        <TabsList className="grid w-full grid-cols-2 max-w-xs mx-auto mb-2">
          <TabsTrigger value="leaflet" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            OpenStreetMap
          </TabsTrigger>
          <TabsTrigger value="google" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Google Maps
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaflet" className="mt-0">
          <LeafletMap
            gpxData={gpxData}
            hoveredPoint={hoveredPoint}
            onHoverPoint={onHoverPoint}
            height={height}
          />
        </TabsContent>

        <TabsContent value="google" className="mt-0">
          <GoogleMap
            gpxData={gpxData}
            hoveredPoint={hoveredPoint}
            onHoverPoint={onHoverPoint}
            height={height}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}