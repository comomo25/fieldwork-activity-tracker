"use client";

import { useState } from "react";
import { ActivityFilter } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { weatherOptions, allParticipants } from "@/lib/dummy-data";
import { Search, Filter } from "lucide-react";

interface ActivityFilterProps {
  filter: ActivityFilter;
  onFilterChange: (filter: ActivityFilter) => void;
}

export function ActivityFilterComponent({ filter, onFilterChange }: ActivityFilterProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localFilter, setLocalFilter] = useState<ActivityFilter>(filter);

  const handleApplyFilter = () => {
    onFilterChange(localFilter);
  };

  const handleReset = () => {
    const emptyFilter: ActivityFilter = {};
    setLocalFilter(emptyFilter);
    onFilterChange(emptyFilter);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="タイトルやノートで検索..."
            value={localFilter.searchText || ""}
            onChange={(e) => setLocalFilter({ ...localFilter, searchText: e.target.value })}
            className="pl-10"
          />
        </div>
        <Button onClick={handleApplyFilter} variant="default">
          検索
        </Button>
        <Button
          onClick={() => setShowAdvanced(!showAdvanced)}
          variant="outline"
        >
          <Filter className="h-4 w-4 mr-2" />
          詳細フィルタ
        </Button>
      </div>

      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">日付（開始）</label>
              <Input
                type="date"
                value={localFilter.dateFrom ? localFilter.dateFrom.toISOString().split('T')[0] : ""}
                onChange={(e) => setLocalFilter({ 
                  ...localFilter, 
                  dateFrom: e.target.value ? new Date(e.target.value) : undefined 
                })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">日付（終了）</label>
              <Input
                type="date"
                value={localFilter.dateTo ? localFilter.dateTo.toISOString().split('T')[0] : ""}
                onChange={(e) => setLocalFilter({ 
                  ...localFilter, 
                  dateTo: e.target.value ? new Date(e.target.value) : undefined 
                })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">最小距離 (km)</label>
              <Input
                type="number"
                value={localFilter.distanceMin || ""}
                onChange={(e) => setLocalFilter({ 
                  ...localFilter, 
                  distanceMin: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">最大距離 (km)</label>
              <Input
                type="number"
                value={localFilter.distanceMax || ""}
                onChange={(e) => setLocalFilter({ 
                  ...localFilter, 
                  distanceMax: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">最小獲得標高 (m)</label>
              <Input
                type="number"
                value={localFilter.elevationMin || ""}
                onChange={(e) => setLocalFilter({ 
                  ...localFilter, 
                  elevationMin: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">最大獲得標高 (m)</label>
              <Input
                type="number"
                value={localFilter.elevationMax || ""}
                onChange={(e) => setLocalFilter({ 
                  ...localFilter, 
                  elevationMax: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button onClick={handleReset} variant="outline">
              リセット
            </Button>
            <Button onClick={handleApplyFilter}>
              フィルタを適用
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}