import type { IMapProvider } from './types'

// 動的インポートでプロバイダーを読み込む
export async function createMapProvider(provider: 'google' | 'leaflet' = 'leaflet'): Promise<IMapProvider> {
  // 環境変数から設定を読む
  const selectedProvider = provider || process.env.NEXT_PUBLIC_MAP_PROVIDER || 'leaflet'
  
  try {
    if (selectedProvider === 'google') {
      // Google Maps APIキーの確認
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
        console.warn('Google Maps API key not configured, falling back to Leaflet')
        const { LeafletProvider } = await import('./providers/leaflet')
        return new LeafletProvider()
      }
      
      const { GoogleMapsProvider } = await import('./providers/google-maps')
      return new GoogleMapsProvider()
    } else {
      const { LeafletProvider } = await import('./providers/leaflet')
      return new LeafletProvider()
    }
  } catch (error) {
    console.error(`Failed to load ${selectedProvider} provider, falling back to Leaflet:`, error)
    const { LeafletProvider } = await import('./providers/leaflet')
    return new LeafletProvider()
  }
}

// プロバイダーの利用可能性をチェック
export function isGoogleMapsAvailable(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  return !!(apiKey && apiKey !== 'YOUR_API_KEY_HERE')
}

// 現在のプロバイダーを取得
export function getCurrentMapProvider(): 'google' | 'leaflet' {
  const provider = process.env.NEXT_PUBLIC_MAP_PROVIDER || 'leaflet'
  
  if (provider === 'google' && isGoogleMapsAvailable()) {
    return 'google'
  }
  
  return 'leaflet'
}