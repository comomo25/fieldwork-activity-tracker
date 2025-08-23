"use client";

import { Activity } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatDate, formatDistance, formatDuration, formatElevation } from "@/lib/utils";
import { Calendar, Clock, Mountain, Users, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ActivityListProps {
  activities: Activity[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ActivityList({ activities, onEdit, onDelete }: ActivityListProps) {
  const router = useRouter();

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">活動記録がありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <Card
          key={activity.id}
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => router.push(`/activities/${activity.id}`)}
        >
          <CardHeader>
            <CardTitle>{activity.title}</CardTitle>
            <CardDescription className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(activity.date)}
              </span>
              <span className="flex items-center gap-1">
                <Cloud className="h-4 w-4" />
                {activity.weather}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">距離</p>
                <p className="font-semibold">{formatDistance(activity.distance)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">時間</p>
                <p className="font-semibold">{formatDuration(activity.duration)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">獲得標高</p>
                <p className="font-semibold">{formatElevation(activity.elevationGain)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">参加者</p>
                <p className="font-semibold">{activity.participants.length}名</p>
              </div>
            </div>
            {activity.fieldNote && (
              <p className="mt-4 text-sm text-gray-600 line-clamp-2">
                {activity.fieldNote}
              </p>
            )}
            <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(activity.id)}
                >
                  編集
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(activity.id)}
                >
                  削除
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}