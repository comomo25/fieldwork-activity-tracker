export type Weather = "晴れ" | "曇り" | "雨" | "雪" | "霧" | "その他";

export interface GPXPoint {
  lat: number;
  lng: number;
  elevation?: number;
  time?: Date;
}

export interface Photo {
  id: string;
  url: string;
  caption?: string;
  lat?: number;
  lng?: number;
  takenAt?: string; // ISO 8601形式の日時文字列（Firebaseとの互換性のため）
}

// ActivityPhotoはPhotoのエイリアス
export type ActivityPhoto = Photo;

export interface Activity {
  id: string;
  title: string;
  date: Date;
  duration: number; // minutes
  distance: number; // km
  elevationGain: number; // meters
  weather: Weather;
  participants: string[];
  gpxData: GPXPoint[];
  photos: Photo[];
  fieldNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityFilter {
  searchText?: string;
  dateFrom?: Date;
  dateTo?: Date;
  distanceMin?: number;
  distanceMax?: number;
  elevationMin?: number;
  elevationMax?: number;
  weather?: Weather[];
  participants?: string[];
}

export type ViewMode = "list" | "map";