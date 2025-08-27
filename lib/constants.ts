// アプリケーション全体の定数定義

// カラーパレット（Radix Lime Theme）
export const COLORS = {
  lime: {
    primary: '#8DB600',
    light: '#C4E64D',
    lighter: '#E3F5AA',
    medium: '#99C513',
    dark: '#5D7C00',
    glow: 'rgba(196, 230, 77, 0.8)',
  },
  glass: {
    light: 'rgba(255, 255, 255, 0.7)',
    dark: 'rgba(13, 15, 8, 0.8)',
    lime: 'rgba(141, 182, 0, 0.1)',
  },
} as const

// マップ設定
export const MAP_CONFIG = {
  defaultCenter: [35.6762, 139.6503] as [number, number], // 東京
  defaultZoom: 10,
  trackZoom: 14,
  maxZoom: 19,
  padding: [50, 50] as [number, number],
  tileUrls: {
    standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  },
  attributions: {
    standard: '© OpenStreetMap contributors',
    satellite: '© Esri',
  },
} as const

// 軌跡スタイル設定
export const TRACK_STYLES = {
  glowOuter: {
    weight: 12,
    opacity: 0.3,
    className: 'glow-outer',
  },
  glowMiddle: {
    weight: 8,
    opacity: 0.4,
    className: 'glow-middle',
  },
  glowInner: {
    weight: 5,
    opacity: 0.6,
    className: 'glow-inner',
  },
  mainTrack: {
    weight: 2,
    opacity: 1,
    className: 'main-track',
  },
} as const

// マーカースタイル設定
export const MARKER_STYLES = {
  start: {
    size: 24,
    borderWidth: 3,
  },
  end: {
    size: 24,
    borderWidth: 3,
  },
  hover: {
    size: 16,
    borderWidth: 2,
  },
} as const

// 標高プロファイル設定
export const ELEVATION_CONFIG = {
  defaultHeight: '200px',
  chartHeight: '250px',
  panelHeight: {
    expanded: '400px',
    collapsed: '40px',
  },
  animation: {
    tension: 0.3,
    pointRadius: 0,
    pointHoverRadius: 6,
    borderWidth: 2.5,
  },
} as const

// アニメーション設定
export const ANIMATION_CONFIG = {
  glowPulse: {
    duration: 2000, // ms
    delay: 500, // ms
  },
  shimmer: {
    duration: 1500, // ms
  },
  fadeIn: {
    duration: 500, // ms
  },
  float: {
    duration: 3000, // ms
  },
} as const

// 地球の半径（距離計算用）
export const EARTH_RADIUS_KM = 6371

// 距離計算の精度設定
export const DISTANCE_CONFIG = {
  hoverThreshold: 0.01, // 近接判定の閾値
  decimalPlaces: 2, // 小数点以下の桁数
} as const

// UI設定
export const UI_CONFIG = {
  panelWidth: '480px',  // 拡大: 420px → 480px
  panelLeftOffset: '508px',  // パネル幅 + margin
  tabsWidth: 'w-48',
  fieldNoteMaxLength: 150, // 折りたたみ表示の文字数
} as const