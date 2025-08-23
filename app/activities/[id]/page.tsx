"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useActivityStore } from "@/lib/store";
import { Activity } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  formatDateTime, 
  formatDistance, 
  formatDuration, 
  formatElevation 
} from "@/lib/utils";
import { 
  Calendar, 
  Clock, 
  Mountain, 
  Users, 
  Cloud, 
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Camera,
  TrendingUp,
  FileText,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  Maximize2
} from "lucide-react";

export default function ActivityDetailWithSidebarPage() {
  const params = useParams();
  const router = useRouter();
  const { activities, deleteActivity, updateActivity } = useActivityStore();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [rightSidebarVisible, setRightSidebarVisible] = useState(true);
  const [isEditingFieldNote, setIsEditingFieldNote] = useState(false);
  const [fieldNoteText, setFieldNoteText] = useState("");
  const [tempFieldNoteText, setTempFieldNoteText] = useState("");
  const [hoveredPoint, setHoveredPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [hoveredDistance, setHoveredDistance] = useState<number | null>(null);

  useEffect(() => {
    const found = activities.find(a => a.id === params.id);
    if (found) {
      setActivity(found);
      setFieldNoteText(found.fieldNote || "");
      setTempFieldNoteText(found.fieldNote || "");
    } else {
      router.push("/");
    }
  }, [params.id, activities, router]);

  if (!activity) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>読み込み中...</p>
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

  const toggleRightSidebar = () => {
    setRightSidebarVisible(!rightSidebarVisible);
  };

  // 地図と標高プロファイルの連動ハンドラ
  const handleHoverPoint = (lat: number, lng: number, distance: number) => {
    setHoveredPoint({ lat, lng });
    setHoveredDistance(distance);
  };

  const handleElevationHover = (distance: number) => {
    setHoveredDistance(distance);
    // GPXデータから距離に対応するポイントを見つける
    if (activity?.gpxData) {
      const point = activity.gpxData.find((p: any) => 
        Math.abs((p.distance || 0) - distance) < 100 // 100m以内の点を探す
      );
      if (point) {
        setHoveredPoint({ lat: point.lat, lng: point.lng });
      }
    }
  };

  // レイアウトの動的計算
  const leftWidth = rightSidebarVisible ? "w-1/4" : "w-1/5";
  const centerWidth = rightSidebarVisible ? "w-[45%]" : "w-4/5";
  const rightWidth = rightSidebarVisible ? "w-[30%]" : "w-0";
  const bottomWidth = rightSidebarVisible ? "w-[70%]" : "w-full";

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* ヘッダー（2層構造） */}
      <div className="bg-white border-b">
        <div className="text-center py-2 border-b">
          <h1 className="text-lg font-semibold">Fieldwork Tracking</h1>
        </div>
        <div className="flex justify-between items-center px-4 py-2">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          
          <div className="flex gap-2">
            <Button onClick={handleEdit} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              編集
            </Button>
            <Button onClick={handleDelete} variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              削除
            </Button>
          </div>
        </div>
      </div>

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左サイドバー */}
        <div className={`${leftWidth} border-r bg-gray-50 p-4 overflow-y-auto transition-all duration-300`}>
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-2">{activity.title}</h2>
              <div className="text-sm text-gray-600">
                <p className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(activity.date)}
                </p>
                <p className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(activity.duration)}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                統計情報
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">距離:</span>
                  <p className="font-medium">{formatDistance(activity.distance)}</p>
                </div>
                <div>
                  <span className="text-gray-500">獲得標高:</span>
                  <p className="font-medium">{formatElevation(activity.elevationGain)}</p>
                </div>
                <div>
                  <span className="text-gray-500">天気:</span>
                  <p className="font-medium">{activity.weather}</p>
                </div>
                <div>
                  <span className="text-gray-500">参加者:</span>
                  <p className="font-medium">{activity.participants.join(", ")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 中央エリア（地図） */}
        <div className={`${centerWidth} relative bg-white transition-all duration-300`}>
          {/* 地図コントロール（右上） */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <Button
              onClick={toggleRightSidebar}
              size="sm"
              variant="outline"
              className="bg-white shadow-md"
              title={rightSidebarVisible ? "フィールドノートを非表示" : "フィールドノートを表示"}
            >
              {rightSidebarVisible ? <ChevronRight className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-white shadow-md"
              title="全体表示"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          {/* サイドバー非表示時の注記 */}
          {!rightSidebarVisible && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 writing-mode-vertical text-sm text-gray-400 z-10">
              フィールドノートを非表示中
            </div>
          )}

          {/* 地図と標高プロファイル */}
          <div className="h-full p-4 flex flex-col">
            {activity.gpxData && activity.gpxData.length > 0 ? (
              <>
                {/* 地図エリア（70%） */}
                <div className="flex-[7] mb-2">
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
                    className="h-full rounded-lg overflow-hidden"
                  />
                </div>
                {/* 標高プロファイル（30%） */}
                <div className="flex-[3]">
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
                    height="100%"
                  />
                </div>
              </>
            ) : (
              <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">GPXデータがありません</p>
              </div>
            )}
          </div>
        </div>

        {/* 右サイドバー（フィールドノート） */}
        <div className={`${rightWidth} border-l bg-gray-50 overflow-hidden transition-all duration-300 ${!rightSidebarVisible && 'opacity-0'}`}>
          {rightSidebarVisible && (
            <div className="h-full flex flex-col p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  フィールドノート
                </h3>
                <div className="flex gap-2">
                  {!isEditingFieldNote ? (
                    <>
                      <Button onClick={handleFieldNoteEdit} size="sm" variant="outline">
                        編集
                      </Button>
                      <Button onClick={toggleRightSidebar} size="sm" variant="ghost">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={handleFieldNoteSave} size="sm" variant="default">
                        <Save className="h-4 w-4 mr-1" />
                        保存
                      </Button>
                      <Button onClick={handleFieldNoteCancel} size="sm" variant="outline">
                        <X className="h-4 w-4 mr-1" />
                        キャンセル
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {isEditingFieldNote ? (
                  <textarea
                    value={tempFieldNoteText}
                    onChange={(e) => setTempFieldNoteText(e.target.value)}
                    className="w-full h-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="フィールドでの観察、気づき、感想などを記録..."
                  />
                ) : (
                  <div className="p-3 bg-white rounded-lg min-h-[200px]">
                    {fieldNoteText ? (
                      <p className="whitespace-pre-wrap">{fieldNoteText}</p>
                    ) : (
                      <p className="text-gray-400 italic">
                        フィールドノートが記録されていません。
                        編集ボタンをクリックして記録を追加してください。
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 下部タブエリア（写真） */}
      <div className={`border-t bg-white ${bottomWidth} transition-all duration-300`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Camera className="h-4 w-4" />
              写真
            </h3>
            <Button size="sm" variant="outline">
              + 追加
            </Button>
          </div>
          
          {activity.photos.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {activity.photos.map((photo) => (
                <div key={photo.id} className="flex-shrink-0">
                  <div className="w-32 h-32 bg-gray-200 rounded-lg overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Camera className="h-8 w-8" />
                    </div>
                  </div>
                  {photo.caption && (
                    <p className="text-xs text-gray-600 mt-1 w-32 truncate">{photo.caption}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">写真が追加されていません</p>
          )}
        </div>
      </div>
    </div>
  );
}

// CSSスタイル（Tailwind拡張）
const styles = `
  .writing-mode-vertical {
    writing-mode: vertical-rl;
    text-orientation: mixed;
  }
`;