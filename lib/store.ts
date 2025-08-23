import { create } from "zustand";
import { Activity, ActivityFilter, ViewMode } from "./types";
import * as firebaseService from "./firebase-service";

interface ActivityStore {
  activities: Activity[];
  filter: ActivityFilter;
  viewMode: ViewMode;
  selectedActivityId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchActivities: () => Promise<void>;
  addActivity: (activity: Omit<Activity, 'id'>) => Promise<void>;
  updateActivity: (id: string, activity: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  setFilter: (filter: ActivityFilter) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedActivityId: (id: string | null) => void;
  getFilteredActivities: () => Activity[];
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  activities: [],
  filter: {},
  viewMode: "list",
  selectedActivityId: null,
  isLoading: false,
  error: null,

  fetchActivities: async () => {
    set({ isLoading: true, error: null });
    try {
      const activities = await firebaseService.getActivities();
      set({ activities, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch activities',
        isLoading: false 
      });
    }
  },
  
  addActivity: async (activity) => {
    set({ isLoading: true, error: null });
    try {
      const id = await firebaseService.createActivity(activity);
      const newActivity = { ...activity, id };
      set((state) => ({ 
        activities: [...state.activities, newActivity],
        isLoading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add activity',
        isLoading: false 
      });
    }
  },
  
  updateActivity: async (id, updatedActivity) => {
    set({ isLoading: true, error: null });
    try {
      await firebaseService.updateActivity(id, updatedActivity);
      set((state) => ({
        activities: state.activities.map((a) =>
          a.id === id ? { ...a, ...updatedActivity, updatedAt: new Date() } : a
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update activity',
        isLoading: false 
      });
    }
  },
  
  deleteActivity: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await firebaseService.deleteActivity(id);
      set((state) => ({
        activities: state.activities.filter((a) => a.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete activity',
        isLoading: false 
      });
    }
  },
  
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
          a.fieldNote?.toLowerCase().includes(searchLower)
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