"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useActivityStore } from "@/lib/store";
import { Activity } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ActivityMapDynamic } from "@/components/activity-map-dynamic";
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
  Camera
} from "lucide-react";

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { activities, deleteActivity } = useActivityStore();
  const [activity, setActivity] = useState<Activity | null>(null);

  useEffect(() => {
    const found = activities.find(a => a.id === params.id);
    if (found) {
      setActivity(found);
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          一覧に戻る
        </Button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{activity.title}</h1>
            <div className="flex items-center gap-4 text-gray-600">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(activity.date)}
              </span>
              <span className="flex items-center gap-1">
                <Cloud className="h-4 w-4" />
                {activity.weather}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleEdit} variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              編集
            </Button>
            <Button onClick={handleDelete} variant="outline">
              <Trash2 className="h-4 w-4 mr-2" />
              削除
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>軌跡</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ActivityMapDynamic activities={[activity]} />
            </CardContent>
          </Card>

          {activity.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  写真
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {activity.photos.map((photo) => (
                    <div key={photo.id} className="space-y-2">
                      <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Camera className="h-8 w-8" />
                        </div>
                      </div>
                      {photo.caption && (
                        <p className="text-sm text-gray-600">{photo.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>詳細情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">日時</p>
                <p className="font-semibold">{formatDateTime(activity.date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">活動時間</p>
                <p className="font-semibold">{formatDuration(activity.duration)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">距離</p>
                <p className="font-semibold">{formatDistance(activity.distance)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">獲得標高</p>
                <p className="font-semibold">{formatElevation(activity.elevationGain)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">天気</p>
                <p className="font-semibold">{activity.weather}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">参加者</p>
                <div className="mt-1">
                  {activity.participants.map((participant, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 mr-2 mb-2 text-sm bg-gray-200 rounded-md"
                    >
                      {participant}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {activity.fieldNotes && (
            <Card>
              <CardHeader>
                <CardTitle>フィールドノート</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{activity.fieldNotes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>GPXデータ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ポイント数</span>
                  <span>{activity.gpxData.length}</span>
                </div>
                {activity.gpxData[0] && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">開始地点</span>
                    <span className="text-xs">
                      {activity.gpxData[0].lat.toFixed(4)}, {activity.gpxData[0].lng.toFixed(4)}
                    </span>
                  </div>
                )}
                {activity.gpxData[activity.gpxData.length - 1] && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">終了地点</span>
                    <span className="text-xs">
                      {activity.gpxData[activity.gpxData.length - 1].lat.toFixed(4)}, 
                      {activity.gpxData[activity.gpxData.length - 1].lng.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}