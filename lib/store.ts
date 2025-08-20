import { create } from "zustand";
import { Activity, ActivityFilter, ViewMode } from "./types";
import { dummyActivities } from "./dummy-data";

interface ActivityStore {
  activities: Activity[];
  filter: ActivityFilter;
  viewMode: ViewMode;
  selectedActivityId: string | null;
  setActivities: (activities: Activity[]) => void;
  addActivity: (activity: Activity) => void;
  updateActivity: (id: string, activity: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  setFilter: (filter: ActivityFilter) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedActivityId: (id: string | null) => void;
  getFilteredActivities: () => Activity[];
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  activities: dummyActivities,
  filter: {},
  viewMode: "list",
  selectedActivityId: null,

  setActivities: (activities) => set({ activities }),
  
  addActivity: (activity) =>
    set((state) => ({ activities: [...state.activities, activity] })),
  
  updateActivity: (id, updatedActivity) =>
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === id ? { ...a, ...updatedActivity, updatedAt: new Date() } : a
      ),
    })),
  
  deleteActivity: (id) =>
    set((state) => ({
      activities: state.activities.filter((a) => a.id !== id),
    })),
  
  setFilter: (filter) => set({ filter }),
  
  setViewMode: (viewMode) => set({ viewMode }),
  
  setSelectedActivityId: (selectedActivityId) => set({ selectedActivityId }),
  
  getFilteredActivities: () => {
    const { activities, filter } = get();
    let filtered = [...activities];

    if (filter.searchText) {
      const searchLower = filter.searchText.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(searchLower) ||
          a.fieldNotes?.toLowerCase().includes(searchLower)
      );
    }

    if (filter.dateFrom) {
      filtered = filtered.filter((a) => a.date >= filter.dateFrom!);
    }

    if (filter.dateTo) {
      filtered = filtered.filter((a) => a.date <= filter.dateTo!);
    }

    if (filter.distanceMin !== undefined) {
      filtered = filtered.filter((a) => a.distance >= filter.distanceMin!);
    }

    if (filter.distanceMax !== undefined) {
      filtered = filtered.filter((a) => a.distance <= filter.distanceMax!);
    }

    if (filter.elevationMin !== undefined) {
      filtered = filtered.filter((a) => a.elevationGain >= filter.elevationMin!);
    }

    if (filter.elevationMax !== undefined) {
      filtered = filtered.filter((a) => a.elevationGain <= filter.elevationMax!);
    }

    if (filter.weather?.length) {
      filtered = filtered.filter((a) => filter.weather!.includes(a.weather));
    }

    if (filter.participants?.length) {
      filtered = filtered.filter((a) =>
        a.participants.some((p) => filter.participants!.includes(p))
      );
    }

    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  },
}));