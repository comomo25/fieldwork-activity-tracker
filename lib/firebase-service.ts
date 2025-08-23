import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Activity } from './types';

const COLLECTION_NAME = 'activities';

// Convert Activity to Firestore document
const activityToFirestore = (activity: Omit<Activity, 'id'>) => {
  return {
    ...activity,
    date: activity.date instanceof Date ? Timestamp.fromDate(activity.date) : activity.date,
    createdAt: activity.createdAt instanceof Date ? Timestamp.fromDate(activity.createdAt) : activity.createdAt,
    updatedAt: activity.updatedAt instanceof Date ? Timestamp.fromDate(activity.updatedAt) : activity.updatedAt,
  };
};

// Convert Firestore document to Activity
const firestoreToActivity = (id: string, data: any): Activity => {
  // Convert GPX data time fields if present and ensure numeric coordinates
  const gpxData = data.gpxData?.map ? data.gpxData.map((point: any) => {
    // Ensure lat/lng are proper numbers
    const lat = typeof point.lat === 'number' ? point.lat : parseFloat(point.lat);
    const lng = typeof point.lng === 'number' ? point.lng : parseFloat(point.lng);
    const elevation = point.elevation ? (typeof point.elevation === 'number' ? point.elevation : parseFloat(point.elevation)) : undefined;
    
    // Convert Firestore Timestamp to Date
    const time = point.time?.toDate ? point.time.toDate() : (point.time ? new Date(point.time) : undefined);
    
    return {
      lat: isNaN(lat) ? 0 : lat,
      lng: isNaN(lng) ? 0 : lng,
      elevation: elevation && !isNaN(elevation) ? elevation : undefined,
      time
    };
  }) : (data.gpxData || []);

  return {
    ...data,
    id,
    date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    gpxData,
  };
};

// Get all activities
export const getActivities = async (): Promise<Activity[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const activities: Activity[] = [];
    querySnapshot.forEach((doc) => {
      activities.push(firestoreToActivity(doc.id, doc.data()));
    });
    
    return activities;
  } catch (error) {
    console.error('Error getting activities:', error);
    throw error;
  }
};

// Get single activity
export const getActivity = async (id: string): Promise<Activity | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return firestoreToActivity(docSnap.id, docSnap.data());
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting activity:', error);
    throw error;
  }
};

// Add new activity
export const createActivity = async (activity: Omit<Activity, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(
      collection(db, COLLECTION_NAME),
      activityToFirestore(activity)
    );
    return docRef.id;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
};

// Update activity
export const updateActivity = async (id: string, updates: Partial<Activity>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData: any = { ...updates, updatedAt: Timestamp.now() };
    
    if (updates.date) {
      updateData.date = Timestamp.fromDate(updates.date);
    }
    if (updates.createdAt) {
      updateData.createdAt = Timestamp.fromDate(updates.createdAt);
    }
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating activity:', error);
    throw error;
  }
};

// Delete activity
export const deleteActivity = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Error deleting activity:', error);
    throw error;
  }
};