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

// 動的インポートでSSRを回避（最適化版を使用）
const MapComponent = dynamic(
  () => import('@/components/leaflet-map-optimized'),
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
  () => import('@/components/elevation-profile-optimized'),
  { ssr: false }
);

const PhotoGallery = dynamic(
  () => import('@/components/photo-gallery-horizontal'),
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
  FileText,
  Camera,
  TrendingUp,
  Trash2,
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
  const [activeBottomTab, setActiveBottomTab] = useState<"elevation" | "photos">("elevation");
  const [hoveredPoint, setHoveredPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [hoveredDistance, setHoveredDistance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isElevationPanelVisible, setIsElevationPanelVisible] = useState(true);
  
  // インライン編集用の状態
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedActivity, setEditedActivity] = useState<Activity | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const loadActivity = async () => {
      setIsLoading(true);
      if (activities.length === 0) {
        await fetchActivities();
      }
      const found = activities.find(a => a.id === params.id);
      if (found) {
        setActivity(found);
        setEditedActivity(found);
      } else {
        router.push("/");
      }
      setIsLoading(false);
    };
    loadActivity();
  }, [params.id, activities, router, fetchActivities]);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + E で編集モード切替
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        if (isEditMode) {
          handleSaveEdit();
        } else {
          handleEdit();
        }
      }
      // ESC でキャンセル
      if (e.key === 'Escape' && isEditMode) {
        handleCancelEdit();
      }
      // Cmd/Ctrl + S で保存
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && isEditMode) {
        e.preventDefault();
        handleSaveEdit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, editedActivity]);

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
    setIsEditMode(true);
    setEditedActivity(activity);
    setHasChanges(false);
  };

  const handleCancelEdit = () => {
    if (hasChanges && !confirm("変更を破棄してもよろしいですか？")) {
      return;
    }
    setIsEditMode(false);
    setEditedActivity(activity);
    setHasChanges(false);
  };

  const handleSaveEdit = () => {
    if (!editedActivity || !hasChanges) {
      setIsEditMode(false);
      return;
    }
    
    updateActivity(activity!.id, editedActivity);
    setActivity(editedActivity);
    setIsEditMode(false);
    setHasChanges(false);
  };

  const handleDelete = () => {
    if (confirm("この活動記録を削除してもよろしいですか？")) {
      deleteActivity(activity.id);
      router.push("/");
    }
  };

  const handleFieldChange = (field: keyof Activity, value: any) => {
    if (!editedActivity) return;
    
    setEditedActivity({
      ...editedActivity,
      [field]: value
    });
    setHasChanges(true);
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
  const handlePhotoAdd = async (files: FileList) => {
    if (!files || !activity) return;
    
    const newPhotos = await handlePhotoUpload(files);
    const updatedPhotos = [...(activity.photos || []), ...newPhotos];
    
    const updatedActivity = { ...activity, photos: updatedPhotos };
    setActivity(updatedActivity);
    updateActivity(activity.id, { photos: updatedPhotos });
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
      <div className="relative z-20 glass-dark border-b border-white/10">
        <div className="flex justify-between items-center px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <h1 className="text-lg font-semibold text-white">Fieldwork Tracking</h1>
          <div className="w-20"></div>
        </div>
      </div>

      {/* 基本情報パネル（左上固定） */}
      <div className="absolute top-20 left-4 z-20 animate-fade-in" style={{ width: '480px' }}>
        <div className={`${isEditMode ? 'glass-amber' : 'glass-lime'} rounded-2xl p-6 border ${isEditMode ? 'border-amber-400/30' : 'border-lime-400/20'} transition-all duration-300`}>
          {/* タイトルとアクションボタン */}
          <div className="flex justify-between items-start mb-4">
            {isEditMode ? (
              <input
                type="text"
                value={editedActivity?.title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="text-2xl font-bold bg-black/20 border border-amber-400/30 rounded-lg px-3 py-1 text-amber text-glow focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:bg-black/30 transition-all w-full mr-2"
                placeholder="タイトル"
                autoFocus
              />
            ) : (
              <h2 className="text-2xl font-bold text-lime text-glow">{activity.title}</h2>
            )}
            <div className="flex gap-1">
              {isEditMode ? (
                <>
                  <Button onClick={handleSaveEdit} variant="ghost" size="sm" className="h-8 px-3 text-green-400 hover:text-green-300 hover:bg-green-400/10 transition-all font-medium">
                    保存
                  </Button>
                  <Button onClick={handleCancelEdit} variant="ghost" size="sm" className="h-8 px-3 text-white/60 hover:text-white hover:bg-white/10 transition-all">
                    取消
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={handleEdit} variant="ghost" size="sm" className="h-8 px-2 text-lime hover:text-lime-light hover:bg-lime-400/10 transition-all">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleDelete} variant="ghost" size="sm" className="h-8 px-2 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {/* 基本情報 */}
          <div className="text-sm space-y-2 mb-4">
            <div className="flex items-center gap-3">
              <span className={`${isEditMode ? 'text-amber-400/60' : 'text-lime-400/60'} min-w-[60px] font-medium transition-colors`}>日付</span>
              {isEditMode ? (
                <input
                  type="date"
                  value={editedActivity?.date || ''}
                  onChange={(e) => handleFieldChange('date', e.target.value)}
                  className="bg-black/20 border border-amber-400/20 rounded px-2 py-1 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:bg-black/30 transition-all"
                />
              ) : (
                <span className="text-white font-semibold">{formatDate(activity.date)}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className={`${isEditMode ? 'text-amber-400/60' : 'text-lime-400/60'} min-w-[60px] font-medium transition-colors`}>時間</span>
              <span className="text-white/50 font-semibold">{formatDuration(activity.duration)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`${isEditMode ? 'text-amber-400/60' : 'text-lime-400/60'} min-w-[60px] font-medium transition-colors`}>距離</span>
              <span className="text-white/50 font-semibold">{formatDistance(activity.distance)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`${isEditMode ? 'text-amber-400/60' : 'text-lime-400/60'} min-w-[60px] font-medium transition-colors`}>標高</span>
              <span className="text-white/50 font-semibold">{formatElevation(activity.elevationGain)}</span>
            </div>
            <div className="flex items-center gap-3">
              <Cloud className={`h-4 w-4 ${isEditMode ? 'text-amber-400/60' : 'text-lime-400/60'} transition-colors`} />
              {isEditMode ? (
                <input
                  type="text"
                  value={editedActivity?.weather || ''}
                  onChange={(e) => handleFieldChange('weather', e.target.value)}
                  className="bg-black/20 border border-amber-400/20 rounded px-2 py-1 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:bg-black/30 transition-all flex-1"
                  placeholder="天気"
                />
              ) : (
                <span className="text-white font-semibold">{activity.weather}</span>
              )}
            </div>
            <div className="flex items-start gap-3">
              <span className={`${isEditMode ? 'text-amber-400/60' : 'text-lime-400/60'} min-w-[60px] font-medium transition-colors`}>参加者</span>
              {isEditMode ? (
                <input
                  type="text"
                  value={editedActivity?.participants.join(", ") || ''}
                  onChange={(e) => handleFieldChange('participants', e.target.value.split(',').map(p => p.trim()).filter(p => p))}
                  className="bg-black/20 border border-amber-400/20 rounded px-2 py-1 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:bg-black/30 transition-all flex-1"
                  placeholder="参加者（カンマ区切り）"
                />
              ) : (
                <span className="text-white font-semibold">{activity.participants.join(", ")}</span>
              )}
            </div>
          </div>
          
          {/* フィールドノート */}
          <div className={`border-t ${isEditMode ? 'border-amber-400/20' : 'border-lime-400/20'} pt-4 transition-colors`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className={`text-sm font-semibold ${isEditMode ? 'text-amber-400/80' : 'text-lime-400/80'} flex items-center gap-2 transition-colors`}>
                <FileText className="h-4 w-4" />
                フィールドノート
              </h3>
            </div>
            
            {isEditMode ? (
              <textarea
                value={editedActivity?.fieldNote || ''}
                onChange={(e) => handleFieldChange('fieldNote', e.target.value)}
                className="w-full h-32 p-3 bg-black/20 border border-amber-400/20 rounded-lg text-sm text-white placeholder-amber-400/40 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:bg-black/30 transition-all"
                placeholder="フィールドでの観察、気づきを記録..."
              />
            ) : (
              <div className="relative">
                <p className={`text-sm text-white/80 leading-relaxed ${
                  !isFieldNoteExpanded ? 'line-clamp-3' : ''
                }`}>
                  {activity.fieldNote || (
                    <span className="text-white/40 italic">
                      フィールドノートが記録されていません
                    </span>
                  )}
                </p>
                {activity.fieldNote && activity.fieldNote.length > 150 && (
                  <button
                    onClick={toggleFieldNoteExpanded}
                    className="text-xs text-white/60 hover:text-white mt-1 transition-colors"
                  >
                    {isFieldNoteExpanded ? '折りたたむ' : '続きを読む'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>



      {/* 下部固定パネル（標高/写真タブ） */}
      <div 
        className="absolute bottom-0 right-4 z-20 glass-dark rounded-t-2xl transition-all duration-300 animate-fade-in" 
        style={{ 
          left: '508px',
          height: isElevationPanelVisible ? '400px' : '40px'
        }}>
        {/* パネルの表示/非表示切り替えボタン */}
        <button
          onClick={() => setIsElevationPanelVisible(!isElevationPanelVisible)}
          className="absolute right-4 top-3 z-10 p-2 glass-lime rounded-full hover:bg-lime-400/20 transition-all text-lime hover:text-lime-light"
          title={isElevationPanelVisible ? "パネルを閉じる" : "パネルを開く"}
        >
          {isElevationPanelVisible ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        </button>

        <Tabs 
          value={activeBottomTab} 
          onValueChange={(v) => setActiveBottomTab(v as any)} 
          className={`h-full flex flex-col ${!isElevationPanelVisible ? 'hidden' : ''}`}
        >
          <TabsList className="grid w-48 grid-cols-2 mx-4 mt-3 bg-lime-400/10 border border-lime-400/20">
            <TabsTrigger value="elevation" className="text-xs text-lime-400/70 data-[state=active]:text-lime data-[state=active]:bg-lime-400/20">
              <TrendingUp className="h-3 w-3 mr-1" />
              標高
            </TabsTrigger>
            <TabsTrigger value="photos" className="text-xs text-lime-400/70 data-[state=active]:text-lime data-[state=active]:bg-lime-400/20">
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
                    <div className="flex gap-4 mt-2 pt-2 border-t border-lime-400/20 text-xs">
                      <div>
                        <span className="text-lime-400/60">累積上昇:</span>
                        <span className="ml-1 font-semibold text-lime-light">{stats.totalAscent}m</span>
                      </div>
                      <div>
                        <span className="text-lime-400/60">累積下降:</span>
                        <span className="ml-1 font-semibold text-lime-light">{stats.totalDescent}m</span>
                      </div>
                      <div>
                        <span className="text-lime-400/60">平均勾配:</span>
                        <span className="ml-1 font-semibold text-lime-light">{stats.averageGradient}%</span>
                      </div>
                      <div>
                        <span className="text-lime-400/60">最高/最低:</span>
                        <span className="ml-1 font-semibold text-lime-light">{stats.maxElevation}/{stats.minElevation}m</span>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-white/40">
                <p>標高データがありません</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="photos" className="flex-1 px-4 pb-4 mt-0">
            <PhotoGallery
              photos={activity.photos || []}
              onPhotoAdd={handlePhotoAdd}
              onPhotoDelete={handlePhotoDelete}
              className="h-full"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}