"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useActivityStore } from "@/lib/store";
import { Activity, Photo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ActivityMapDynamic } from "@/components/activity-map-dynamic";
import { weatherOptions, allParticipants } from "@/lib/dummy-data";
import { 
  formatDistance, 
  formatDuration, 
  formatElevation,
  formatDateTime 
} from "@/lib/utils";
import { ArrowLeft, Save, X } from "lucide-react";

export default function EditActivityPage() {
  const params = useParams();
  const router = useRouter();
  const { activities, updateActivity } = useActivityStore();
  const [activity, setActivity] = useState<Activity | null>(null);
  
  // 編集用のステート
  const [title, setTitle] = useState("");
  const [weather, setWeather] = useState<string>("晴れ");
  const [participants, setParticipants] = useState<string>("");
  const [fieldNotes, setFieldNotes] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    const found = activities.find(a => a.id === params.id);
    if (found) {
      setActivity(found);
      setTitle(found.title);
      setWeather(found.weather);
      setParticipants(found.participants.join(", "));
      setFieldNotes(found.fieldNotes || "");
      setPhotos(found.photos);
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

  const handleSave = async () => {
    if (!title.trim()) {
      alert("タイトルを入力してください");
      return;
    }

    const updatedActivity: Partial<Activity> = {
      title: title.trim(),
      weather: weather as any,
      participants: participants.split(",").map(p => p.trim()).filter(p => p),
      photos,
      fieldNotes: fieldNotes.trim(),
    };

    await updateActivity(activity.id, updatedActivity);
    router.push(`/activities/${activity.id}`);
  };

  const handleCancel = () => {
    router.push(`/activities/${activity.id}`);
  };

  const handleAddPhoto = () => {
    const newPhoto: Photo = {
      id: `photo-${Date.now()}`,
      url: `/images/placeholder-${photos.length + 1}.jpg`,
      caption: "",
    };
    setPhotos([...photos, newPhoto]);
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos(photos.filter(p => p.id !== photoId));
  };

  const handlePhotoCaptionChange = (photoId: string, caption: string) => {
    setPhotos(photos.map(p => 
      p.id === photoId ? { ...p, caption } : p
    ));
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/activities/${activity.id}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          詳細に戻る
        </Button>
        
        <h1 className="text-3xl font-bold">活動記録の編集</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">タイトル *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例: 富士山登山"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">天気</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                >
                  {weatherOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium">参加者 (コンマ区切り)</label>
                <Input
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder="例: 田中太郎, 佐藤花子"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {allParticipants.map(p => (
                    <button
                      key={p}
                      className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                      onClick={() => {
                        const current = participants.split(",").map(s => s.trim());
                        if (!current.includes(p)) {
                          setParticipants(
                            participants ? `${participants}, ${p}` : p
                          );
                        }
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">フィールドノート</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md"
                  rows={4}
                  value={fieldNotes}
                  onChange={(e) => setFieldNotes(e.target.value)}
                  placeholder="活動の詳細や所感を記入..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>写真</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {photos.map((photo) => (
                  <div key={photo.id} className="flex gap-3 p-3 border rounded">
                    <div className="w-20 h-20 bg-gray-200 rounded flex-shrink-0" />
                    <div className="flex-1">
                      <Input
                        value={photo.caption || ""}
                        onChange={(e) => handlePhotoCaptionChange(photo.id, e.target.value)}
                        placeholder="キャプション"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePhoto(photo.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleAddPhoto}
                >
                  写真を追加
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>GPX情報（変更不可）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">距離</span>
                  <span className="font-semibold">
                    {formatDistance(activity.distance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">時間</span>
                  <span className="font-semibold">
                    {formatDuration(activity.duration)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">獲得標高</span>
                  <span className="font-semibold">
                    {formatElevation(activity.elevationGain)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">日時</span>
                  <span className="font-semibold">
                    {formatDateTime(activity.date)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>軌跡プレビュー</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <ActivityMapDynamic activities={[{
                  ...activity,
                  title: title || activity.title,
                  weather: weather as any,
                  participants: participants.split(",").map(p => p.trim()).filter(p => p),
                  photos,
                  fieldNotes,
                }]} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={handleCancel}
        >
          キャンセル
        </Button>
        <Button
          onClick={handleSave}
        >
          <Save className="h-4 w-4 mr-2" />
          保存
        </Button>
      </div>
    </div>
  );
}