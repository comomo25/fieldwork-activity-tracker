"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useActivityStore } from "@/lib/store";
import { Activity } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { handlePhotoUpload, deletePhoto } from "@/lib/photo-utils";
import { calculateGPXStats } from "@/lib/gpx-stats";
import dynamic from 'next/dynamic';

// 動的インポートでSSRを回避
const MapComponent = dynamic(
  () => import('@/components/leaflet-map-fixed'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">地図を読み込み中...</p>
        </div>
      </div>
    )
  }
);

const ElevationProfile = dynamic(
  () => import('@/components/elevation-profile-fixed'),
  { ssr: false }
);

import { 
  formatDate, 
  formatDistance, 
  formatDuration, 
  formatElevation 
} from "@/lib/utils";

import { 
  ArrowLeft,
  Edit,
  MoreVertical,
  FileText,
  Camera,
  TrendingUp,
  Save,
  X,
  Plus,
  Trash2,
  MapPin,
  Cloud,
  ChevronUp,
  ChevronDown
} from "lucide-react";

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { activities, deleteActivity, updateActivity, fetchActivities } = useActivityStore();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isFieldNoteExpanded, setIsFieldNoteExpanded] = useState(false);
  const [isEditingFieldNote, setIsEditingFieldNote] = useState(false);
  const [fieldNoteText, setFieldNoteText] = useState("");
  const [tempFieldNoteText, setTempFieldNoteText] = useState("");
  const [activeBottomTab, setActiveBottomTab] = useState<"elevation" | "photos">("elevation");
  const [hoveredPoint, setHoveredPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [hoveredDistance, setHoveredDistance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isElevationPanelVisible, setIsElevationPanelVisible] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadActivity = async () => {
      setIsLoading(true);
      if (activities.length === 0) {
        await fetchActivities();
      }
      const found = activities.find(a => a.id === params.id);
      if (found) {
        setActivity(found);
        setFieldNoteText(found.fieldNote || "");
        setTempFieldNoteText(found.fieldNote || "");
      } else {
        router.push("/");
      }
      setIsLoading(false);
    };
    loadActivity();
  }, [params.id, activities, router, fetchActivities]);

  if (isLoading || !activity) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    router.push(`/activities/${activity.id}/edit`);
  };

  const handleDelete = () => {
    if (confirm("この活動記録を削除してもよろしいですか？")) {
      deleteActivity(activity.id);
      router.push("/");
    }
  };

  const handleFieldNoteEdit = () => {
    setIsEditingFieldNote(true);
    setTempFieldNoteText(fieldNoteText);
  };

  const handleFieldNoteSave = () => {
    setFieldNoteText(tempFieldNoteText);
    updateActivity(activity.id, { ...activity, fieldNote: tempFieldNoteText });
    setIsEditingFieldNote(false);
  };

  const handleFieldNoteCancel = () => {
    setTempFieldNoteText(fieldNoteText);
    setIsEditingFieldNote(false);
  };

  const toggleFieldNoteExpanded = () => {
    setIsFieldNoteExpanded(!isFieldNoteExpanded);
  };

  // 地図と標高プロファイルの連動ハンドラ
  const handleHoverPoint = (lat: number, lng: number, distance: number) => {
    setHoveredPoint({ lat, lng });
    setHoveredDistance(distance);
  };

  const handleElevationHover = (distance: number) => {
    setHoveredDistance(distance);
    if (activity?.gpxData) {
      const point = activity.gpxData.find((p: any) => 
        Math.abs((p.distance || 0) - distance) < 100
      );
      if (point) {
        setHoveredPoint({ lat: point.lat, lng: point.lng });
      }
    }
  };

  // 写真アップロード処理
  const handlePhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !activity) return;
    
    const newPhotos = await handlePhotoUpload(e.target.files);
    const updatedPhotos = [...(activity.photos || []), ...newPhotos];
    
    const updatedActivity = { ...activity, photos: updatedPhotos };
    setActivity(updatedActivity);
    updateActivity(activity.id, { photos: updatedPhotos });
    
    // inputをリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 写真削除処理
  const handlePhotoDelete = (photoId: string) => {
    if (!activity) return;
    
    const updatedPhotos = deletePhoto(activity.photos || [], photoId);
    const updatedActivity = { ...activity, photos: updatedPhotos };
    setActivity(updatedActivity);
    updateActivity(activity.id, { photos: updatedPhotos });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden relative">
      {/* Layer 1: 地図背景（全画面） */}
      <div className="absolute inset-0">
        {activity.gpxData && activity.gpxData.length > 0 ? (
          <MapComponent 
            gpxData={{
              tracks: [{
                points: activity.gpxData.map((p: any) => ({
                  lat: p.lat,
                  lng: p.lng,
                  elevation: p.elevation || p.ele,
                  time: p.time
                }))
              }]
            }}
            hoveredPoint={hoveredPoint}
            onHoverPoint={handleHoverPoint}
            height="100%"
            className="h-full w-full"
          />
        ) : (
          <div className="h-full w-full bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500">GPXデータがありません</p>
          </div>
        )}
      </div>

      {/* Layer 2: オーバーレイパネル群 */}

      {/* Layer 3: ヘッダー */}
      <div className="relative z-20 bg-white shadow-md">
        <div className="flex justify-between items-center px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <h1 className="text-lg font-semibold">Fieldwork Tracking</h1>
          <div className="w-20"></div>
        </div>
      </div>

      {/* 基本情報パネル（左上固定） */}
      <div className="absolute top-20 left-4 z-20" style={{ width: '576px' }}>
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4">
          {/* タイトルとアクションボタン */}
          <div className="flex justify-between items-start mb-3">
            <h2 className="text-lg font-bold">{activity.title}</h2>
            <div className="flex gap-1">
              <Button onClick={handleEdit} variant="ghost" size="sm" className="h-8 px-2">
                <Edit className="h-4 w-4" />
              </Button>
              <Button onClick={handleDelete} variant="ghost" size="sm" className="h-8 px-2">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* 基本情報 */}
          <div className="text-sm space-y-1.5 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 min-w-[60px]">日付:</span>
              <span className="font-medium">{formatDate(activity.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 min-w-[60px]">時間:</span>
              <span className="font-medium">{formatDuration(activity.duration)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 min-w-[60px]">距離:</span>
              <span className="font-medium">{formatDistance(activity.distance)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 min-w-[60px]">標高:</span>
              <span className="font-medium">{formatElevation(activity.elevationGain)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-gray-600" />
              <span className="font-medium">{activity.weather}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-600 min-w-[60px]">参加者:</span>
              <span className="font-medium">{activity.participants.join(", ")}</span>
            </div>
          </div>
          
          {/* フィールドノート */}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                フィールドノート
              </h3>
              <div className="flex gap-1">
                {!isEditingFieldNote ? (
                  <Button onClick={handleFieldNoteEdit} variant="ghost" size="sm" className="h-6 px-2 text-xs">
                    編集
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleFieldNoteSave} variant="ghost" size="sm" className="h-6 px-2 text-xs">
                      保存
                    </Button>
                    <Button onClick={handleFieldNoteCancel} variant="ghost" size="sm" className="h-6 px-2 text-xs">
                      取消
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            {isEditingFieldNote ? (
              <textarea
                value={tempFieldNoteText}
                onChange={(e) => setTempFieldNoteText(e.target.value)}
                className="w-full h-24 p-2 border rounded text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="フィールドでの観察、気づきを記録..."
              />
            ) : (
              <div className="relative">
                <p className={`text-sm text-gray-600 leading-relaxed ${
                  !isFieldNoteExpanded ? 'line-clamp-3' : ''
                }`}>
                  {fieldNoteText || (
                    <span className="text-gray-400 italic">
                      フィールドノートが記録されていません
                    </span>
                  )}
                </p>
                {fieldNoteText && fieldNoteText.length > 150 && (
                  <button
                    onClick={toggleFieldNoteExpanded}
                    className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                  >
                    {isFieldNoteExpanded ? '折りたたむ' : '続きを読む'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>



      {/* 下部固定パネル（標高/写真タブ） - ActivityInfoCardの右端から画面右端まで */}
      <div 
        className="absolute bottom-0 right-4 z-20 bg-white/90 backdrop-blur-sm rounded-t-lg shadow-lg transition-all duration-300" 
        style={{ 
          left: '596px',
          height: isElevationPanelVisible ? '400px' : '40px'
        }}>
        {/* パネルの表示/非表示切り替えボタン */}
        <button
          onClick={() => setIsElevationPanelVisible(!isElevationPanelVisible)}
          className="absolute right-4 top-2 z-10 p-1 bg-white rounded hover:bg-gray-100 transition-colors"
          title={isElevationPanelVisible ? "パネルを閉じる" : "パネルを開く"}
        >
          {isElevationPanelVisible ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        </button>

        <Tabs 
          value={activeBottomTab} 
          onValueChange={(v) => setActiveBottomTab(v as any)} 
          className={`h-full flex flex-col ${!isElevationPanelVisible ? 'hidden' : ''}`}
        >
          <TabsList className="grid w-48 grid-cols-2 mx-4 mt-2">
            <TabsTrigger value="elevation" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              標高
            </TabsTrigger>
            <TabsTrigger value="photos" className="text-xs">
              <Camera className="h-3 w-3 mr-1" />
              写真
            </TabsTrigger>
          </TabsList>

          <TabsContent value="elevation" className="flex-1 px-4 pb-4 mt-0">
            {activity.gpxData && activity.gpxData.length > 0 ? (
              <div className="h-full flex flex-col">
                <div className="flex-1">
                  <ElevationProfile
                    gpxData={{
                      tracks: [{
                        points: activity.gpxData.map((p: any) => ({
                          lat: p.lat,
                          lng: p.lng,
                          elevation: p.elevation || p.ele,
                          time: p.time
                        }))
                      }]
                    }}
                    onHoverPoint={handleHoverPoint}
                    height="250px"
                  />
                </div>
                {(() => {
                  const stats = calculateGPXStats(activity.gpxData);
                  return stats ? (
                    <div className="flex gap-4 mt-2 pt-2 border-t text-xs">
                      <div>
                        <span className="text-gray-500">累積上昇:</span>
                        <span className="ml-1 font-medium">{stats.totalAscent}m</span>
                      </div>
                      <div>
                        <span className="text-gray-500">累積下降:</span>
                        <span className="ml-1 font-medium">{stats.totalDescent}m</span>
                      </div>
                      <div>
                        <span className="text-gray-500">平均勾配:</span>
                        <span className="ml-1 font-medium">{stats.averageGradient}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">最高/最低:</span>
                        <span className="ml-1 font-medium">{stats.maxElevation}/{stats.minElevation}m</span>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>標高データがありません</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="photos" className="flex-1 px-4 pb-4 mt-0">
            <div className="flex items-center justify-between mb-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoAdd}
                className="hidden"
              />
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="h-3 w-3 mr-1" />
                追加
              </Button>
            </div>
            
            {activity.photos && activity.photos.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {activity.photos.map((photo) => (
                  <div key={photo.id} className="flex-shrink-0 relative group">
                    <div className="w-28 h-28 bg-gray-200 rounded-lg overflow-hidden">
                      {photo.url ? (
                        <img 
                          src={photo.url} 
                          alt={photo.caption || '写真'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Camera className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => handlePhotoDelete(photo.id)}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {photo.caption && (
                      <p className="text-xs text-gray-600 mt-1 w-28 truncate" title={photo.caption}>
                        {photo.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">写真が追加されていません</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}