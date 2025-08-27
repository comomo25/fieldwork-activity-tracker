"use client";

import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useActivityStore } from "@/lib/store";
import { Activity } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { handlePhotoUpload, deletePhoto } from "@/lib/photo-utils";
import { calculateGPXStats } from "@/lib/gpx-stats";
import { COLORS, UI_CONFIG, ELEVATION_CONFIG } from "@/lib/constants";
import dynamic from 'next/dynamic';

// 動的インポートでSSRを回避（最適化版を使用）
const MapComponent = dynamic(
  () => import('@/components/leaflet-map-optimized'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center glass-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-500 mx-auto mb-2"></div>
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

import { 
  formatDate, 
  formatDistance, 
  formatDuration, 
  formatElevation 
} from "@/lib/utils";

import { 
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Camera,
  TrendingUp,
  Plus,
  X,
  Cloud,
  ChevronUp,
  ChevronDown
} from "lucide-react";

// フィールドノートセクションのメモ化
const FieldNoteSection = memo(({ 
  fieldNoteText, 
  isEditingFieldNote, 
  tempFieldNoteText,
  onEdit,
  onSave,
  onCancel,
  onChange,
  isExpanded,
  onToggleExpand
}: {
  fieldNoteText: string;
  isEditingFieldNote: boolean;
  tempFieldNoteText: string;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onChange: (text: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) => (
  <div className="border-t border-lime-400/20 pt-4">
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-sm font-semibold text-lime-400/80 flex items-center gap-2">
        <FileText className="h-4 w-4" />
        フィールドノート
      </h3>
      <div className="flex gap-1">
        {!isEditingFieldNote ? (
          <Button onClick={onEdit} variant="ghost" size="sm" className="h-6 px-2 text-xs text-lime-400/60 hover:text-lime-400 hover:bg-lime-400/10 transition-all">
            編集
          </Button>
        ) : (
          <>
            <Button onClick={onSave} variant="ghost" size="sm" className="h-6 px-2 text-xs text-white/60 hover:text-white hover:bg-white/10">
              保存
            </Button>
            <Button onClick={onCancel} variant="ghost" size="sm" className="h-6 px-2 text-xs text-white/60 hover:text-white hover:bg-white/10">
              取消
            </Button>
          </>
        )}
      </div>
    </div>
    
    {isEditingFieldNote ? (
      <textarea
        value={tempFieldNoteText}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-24 p-3 bg-black/20 border border-lime-400/20 rounded-lg text-sm text-white placeholder-lime-400/40 resize-none focus:outline-none focus:ring-2 focus:ring-lime-400/30 focus:bg-black/30 transition-all"
        placeholder="フィールドでの観察、気づきを記録..."
      />
    ) : (
      <div className="relative">
        <p className={`text-sm text-white/80 leading-relaxed ${
          !isExpanded ? 'line-clamp-3' : ''
        }`}>
          {fieldNoteText || (
            <span className="text-white/40 italic">
              フィールドノートが記録されていません
            </span>
          )}
        </p>
        {fieldNoteText && fieldNoteText.length > UI_CONFIG.fieldNoteMaxLength && (
          <button
            onClick={onToggleExpand}
            className="text-xs text-white/60 hover:text-white mt-1 transition-colors"
          >
            {isExpanded ? '折りたたむ' : '続きを読む'}
          </button>
        )}
      </div>
    )}
  </div>
));

FieldNoteSection.displayName = 'FieldNoteSection';

export default function ActivityDetailPageOptimized() {
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

  // コールバックのメモ化
  const handleEdit = useCallback(() => {
    router.push(`/activities/${activity?.id}/edit`);
  }, [activity?.id, router]);

  const handleDelete = useCallback(() => {
    if (confirm("この活動記録を削除してもよろしいですか？") && activity) {
      deleteActivity(activity.id);
      router.push("/");
    }
  }, [activity, deleteActivity, router]);

  const handleFieldNoteEdit = useCallback(() => {
    setIsEditingFieldNote(true);
    setTempFieldNoteText(fieldNoteText);
  }, [fieldNoteText]);

  const handleFieldNoteSave = useCallback(() => {
    if (activity) {
      setFieldNoteText(tempFieldNoteText);
      updateActivity(activity.id, { ...activity, fieldNote: tempFieldNoteText });
      setIsEditingFieldNote(false);
    }
  }, [activity, tempFieldNoteText, updateActivity]);

  const handleFieldNoteCancel = useCallback(() => {
    setTempFieldNoteText(fieldNoteText);
    setIsEditingFieldNote(false);
  }, [fieldNoteText]);

  const toggleFieldNoteExpanded = useCallback(() => {
    setIsFieldNoteExpanded(prev => !prev);
  }, []);

  const handleHoverPoint = useCallback((lat: number, lng: number, distance: number) => {
    setHoveredPoint({ lat, lng });
  }, []);

  const handlePhotoAdd = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !activity) return;
    
    const newPhotos = await handlePhotoUpload(e.target.files);
    const updatedPhotos = [...(activity.photos || []), ...newPhotos];
    
    const updatedActivity = { ...activity, photos: updatedPhotos };
    setActivity(updatedActivity);
    updateActivity(activity.id, { photos: updatedPhotos });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [activity, updateActivity]);

  const handlePhotoDelete = useCallback((photoId: string) => {
    if (!activity) return;
    
    const updatedPhotos = deletePhoto(activity.photos || [], photoId);
    const updatedActivity = { ...activity, photos: updatedPhotos };
    setActivity(updatedActivity);
    updateActivity(activity.id, { photos: updatedPhotos });
  }, [activity, updateActivity]);

  // GPXデータの変換をメモ化
  const gpxData = useMemo(() => {
    if (!activity?.gpxData?.length) return null;
    return {
      tracks: [{
        points: activity.gpxData.map((p: any) => ({
          lat: p.lat,
          lng: p.lng,
          elevation: p.elevation || p.ele,
          time: p.time
        }))
      }]
    };
  }, [activity?.gpxData]);

  // 統計情報のメモ化
  const gpxStats = useMemo(() => {
    if (!activity?.gpxData) return null;
    return calculateGPXStats(activity.gpxData);
  }, [activity?.gpxData]);

  if (isLoading || !activity) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden relative">
      {/* Layer 1: 地図背景（全画面） */}
      <div className="absolute inset-0">
        {gpxData ? (
          <MapComponent 
            gpxData={gpxData}
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
      <div className="absolute top-20 left-4 z-20 animate-fade-in" style={{ width: UI_CONFIG.panelWidth }}>
        <div className="glass-lime rounded-2xl p-6 border border-lime-400/20">
          {/* タイトルとアクションボタン */}
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-lime text-glow">{activity.title}</h2>
            <div className="flex gap-1">
              <Button onClick={handleEdit} variant="ghost" size="sm" className="h-8 px-2 text-lime hover:text-lime-light hover:bg-lime-400/10 transition-all">
                <Edit className="h-4 w-4" />
              </Button>
              <Button onClick={handleDelete} variant="ghost" size="sm" className="h-8 px-2 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* 基本情報 */}
          <div className="text-sm space-y-2 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-lime-400/60 min-w-[60px] font-medium">日付</span>
              <span className="text-white font-semibold">{formatDate(activity.date)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lime-400/60 min-w-[60px] font-medium">時間</span>
              <span className="text-white font-semibold">{formatDuration(activity.duration)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lime-400/60 min-w-[60px] font-medium">距離</span>
              <span className="text-white font-semibold">{formatDistance(activity.distance)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lime-400/60 min-w-[60px] font-medium">標高</span>
              <span className="text-white font-semibold">{formatElevation(activity.elevationGain)}</span>
            </div>
            <div className="flex items-center gap-3">
              <Cloud className="h-4 w-4 text-lime-400/60" />
              <span className="text-white font-semibold">{activity.weather}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lime-400/60 min-w-[60px] font-medium">参加者</span>
              <span className="text-white font-semibold">{activity.participants.join(", ")}</span>
            </div>
          </div>
          
          {/* フィールドノート */}
          <FieldNoteSection
            fieldNoteText={fieldNoteText}
            isEditingFieldNote={isEditingFieldNote}
            tempFieldNoteText={tempFieldNoteText}
            onEdit={handleFieldNoteEdit}
            onSave={handleFieldNoteSave}
            onCancel={handleFieldNoteCancel}
            onChange={setTempFieldNoteText}
            isExpanded={isFieldNoteExpanded}
            onToggleExpand={toggleFieldNoteExpanded}
          />
        </div>
      </div>

      {/* 下部固定パネル（標高/写真タブ） */}
      <div 
        className="absolute bottom-0 right-4 z-20 glass-dark rounded-t-2xl transition-all duration-300 animate-fade-in" 
        style={{ 
          left: UI_CONFIG.panelLeftOffset,
          height: isElevationPanelVisible ? ELEVATION_CONFIG.panelHeight.expanded : ELEVATION_CONFIG.panelHeight.collapsed
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
            {gpxData ? (
              <div className="h-full flex flex-col">
                <div className="flex-1">
                  <ElevationProfile
                    gpxData={gpxData}
                    onHoverPoint={handleHoverPoint}
                    height={ELEVATION_CONFIG.chartHeight}
                  />
                </div>
                {gpxStats && (
                  <div className="flex gap-4 mt-2 pt-2 border-t border-lime-400/20 text-xs">
                    <div>
                      <span className="text-lime-400/60">累積上昇:</span>
                      <span className="ml-1 font-semibold text-lime-light">{gpxStats.totalAscent}m</span>
                    </div>
                    <div>
                      <span className="text-lime-400/60">累積下降:</span>
                      <span className="ml-1 font-semibold text-lime-light">{gpxStats.totalDescent}m</span>
                    </div>
                    <div>
                      <span className="text-lime-400/60">平均勾配:</span>
                      <span className="ml-1 font-semibold text-lime-light">{gpxStats.averageGradient}%</span>
                    </div>
                    <div>
                      <span className="text-lime-400/60">最高/最低:</span>
                      <span className="ml-1 font-semibold text-lime-light">{gpxStats.maxElevation}/{gpxStats.minElevation}m</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-white/40">
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
                className="btn-lime"
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
              <p className="text-white/40 text-sm">写真が追加されていません</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}