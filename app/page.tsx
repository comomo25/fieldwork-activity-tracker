"use client";

import { useState, useEffect } from "react";
import { useActivityStore } from "@/lib/store";
import { ActivityList } from "@/components/activity-list";
import MapSwitcher from "@/components/map-switcher";
import { ActivityFilterComponent } from "@/components/activity-filter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const { 
    filter, 
    viewMode, 
    setFilter, 
    setViewMode, 
    getFilteredActivities,
    deleteActivity,
    fetchActivities,
    isLoading,
    error
  } = useActivityStore();
  
  const filteredActivities = getFilteredActivities();

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleEdit = (id: string) => {
    router.push(`/activities/${id}/edit`);
  };

  const handleDelete = (id: string) => {
    if (confirm("この活動記録を削除してもよろしいですか？")) {
      deleteActivity(id);
    }
  };

  const handleActivityClick = (id: string) => {
    router.push(`/activities/${id}`);
  };

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-red-500">エラー: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">活動記録</h1>
        <Button onClick={() => router.push("/activities/new")}>
          <Plus className="h-4 w-4 mr-2" />
          新規作成
        </Button>
      </div>

      {isLoading && <div className="text-center py-4">読み込み中...</div>}

      <ActivityFilterComponent filter={filter} onFilterChange={setFilter} />

      <div className="mt-8">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
          <TabsList className="grid w-[200px] grid-cols-2">
            <TabsTrigger value="list">リスト</TabsTrigger>
            <TabsTrigger value="map">地図</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="mt-6">
            <ActivityList 
              activities={filteredActivities}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </TabsContent>
          
          <TabsContent value="map" className="mt-6">
            <div className="w-full">
              <MapSwitcher
                gpxData={filteredActivities[0]?.gpxData}
                height="600px"
                defaultProvider="leaflet"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}