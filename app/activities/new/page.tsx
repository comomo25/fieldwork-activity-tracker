"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useActivityStore } from "@/lib/store";
import { Activity, GPXPoint, Photo } from "@/lib/types";
import { parseGPX, generateDummyGPX } from "@/lib/gpx-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ActivityMapDynamic } from "@/components/activity-map-dynamic";
import { weatherOptions } from "@/lib/dummy-data";
import { 
  formatDistance, 
  formatDuration, 
  formatElevation,
  formatDateTime 
} from "@/lib/utils";
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  MapPin,
  Clock,
  Mountain,
  Plus,
  X
} from "lucide-react";

export default function NewActivityPage() {
  const router = useRouter();
  const { addActivity } = useActivityStore();
  const [step, setStep] = useState(1);
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [gpxData, setGpxData] = useState<GPXPoint[]>([]);
  const [parseResult, setParseResult] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // メタデータ
  const [title, setTitle] = useState("");
  const [weather, setWeather] = useState<string>("晴れ");
  const [participants, setParticipants] = useState<string>("");
  const [fieldNotes, setFieldNotes] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setGpxFile(file);
    
    try {
      const content = await file.text();
      const result = parseGPX(content);
      setGpxData(result.points);
      setParseResult(result);
    } catch (error) {
      console.error("GPX解析エラー:", error);
      alert("GPXファイルの解析に失敗しました");
    }
  };

  const handleUseDummyGPX = () => {
    const dummyContent = generateDummyGPX();
    const result = parseGPX(dummyContent);
    setGpxData(result.points);
    setParseResult(result);
    setGpxFile(new File([dummyContent], "dummy.gpx", { type: "application/gpx+xml" }));
  };

  const handleNextStep = () => {
    if (step === 1 && gpxData.length > 0) {
      setStep(2);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert("タイトルを入力してください");
      return;
    }

    const newActivity: Activity = {
      id: Date.now().toString(),
      title: title.trim(),
      date: parseResult?.startTime || new Date(),
      duration: parseResult?.duration || 0,
      distance: parseResult?.distance || 0,
      elevationGain: parseResult?.elevationGain || 0,
      weather: weather as any,
      participants: participants.split(",").map(p => p.trim()).filter(p => p),
      gpxData,
      photos,
      fieldNotes: fieldNotes.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addActivity(newActivity);
    router.push("/");
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
        
        <h1 className="text-3xl font-bold">新規活動記録</h1>
      </div>

      <div className="mb-6">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step >= 1 ? "bg-primary text-primary-foreground" : "bg-gray-200"
          }`}>
            1
          </div>
          <div className={`flex-1 h-1 mx-2 ${
            step >= 2 ? "bg-primary" : "bg-gray-200"
          }`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step >= 2 ? "bg-primary text-primary-foreground" : "bg-gray-200"
          }`}>
            2
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-sm">ファイルアップロード</span>
          <span className="text-sm">情報入力</span>
        </div>
      </div>

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>GPXファイルのアップロード</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                dragActive ? "border-primary bg-primary/5" : "border-gray-300"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                GPXファイルをドラッグ&ドロップまたは
              </p>
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-primary hover:underline">ファイルを選択</span>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".gpx,.kml,.fit"
                  onChange={handleFileChange}
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">
                対応形式: GPX, KML, FIT
              </p>
            </div>

            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={handleUseDummyGPX}
              >
                ダミーGPXを使用
              </Button>
            </div>

            {parseResult && (
              <div className="mt-6 space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-semibold mb-2">
                    <FileText className="inline h-4 w-4 mr-2" />
                    ファイル解析完了
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">距離:</span>
                      <span className="ml-2 font-semibold">
                        {formatDistance(parseResult.distance)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">時間:</span>
                      <span className="ml-2 font-semibold">
                        {formatDuration(parseResult.duration)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">獲得標高:</span>
                      <span className="ml-2 font-semibold">
                        {formatElevation(parseResult.elevationGain)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">開始時刻:</span>
                      <span className="ml-2 font-semibold">
                        {formatDateTime(parseResult.startTime)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-64">
                  <ActivityMapDynamic activities={[{
                    id: "preview",
                    title: "Preview",
                    date: new Date(),
                    duration: 0,
                    distance: 0,
                    elevationGain: 0,
                    weather: "晴れ",
                    participants: [],
                    gpxData,
                    photos: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  }]} />
                </div>

                <Button
                  className="w-full"
                  onClick={handleNextStep}
                >
                  次へ
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
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
                <CardTitle>GPX情報</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">距離</span>
                    <span className="font-semibold">
                      {formatDistance(parseResult?.distance || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">時間</span>
                    <span className="font-semibold">
                      {formatDuration(parseResult?.duration || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">獲得標高</span>
                    <span className="font-semibold">
                      {formatElevation(parseResult?.elevationGain || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">開始時刻</span>
                    <span className="font-semibold">
                      {formatDateTime(parseResult?.startTime || new Date())}
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
                <div className="h-96">
                  <ActivityMapDynamic activities={[{
                    id: "preview",
                    title: title || "Preview",
                    date: parseResult?.startTime || new Date(),
                    duration: parseResult?.duration || 0,
                    distance: parseResult?.distance || 0,
                    elevationGain: parseResult?.elevationGain || 0,
                    weather: weather as any,
                    participants: participants.split(",").map(p => p.trim()).filter(p => p),
                    gpxData,
                    photos,
                    fieldNotes,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  }]} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={() => setStep(1)}
          >
            戻る
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
          >
            保存
          </Button>
        </div>
      )}
    </div>
  );
}