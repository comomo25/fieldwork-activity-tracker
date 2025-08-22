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
    date: Timestamp.fromDate(activity.date),
    createdAt: Timestamp.fromDate(activity.createdAt),
    updatedAt: Timestamp.fromDate(activity.updatedAt),
  };
};

// Convert Firestore document to Activity
const firestoreToActivity = (id: string, data: any): Activity => {
  return {
    ...data,
    id,
    date: data.date.toDate(),
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
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