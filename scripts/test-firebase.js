// Test script to verify Firebase connection
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDscdft4Y4CG0fx6WUMknJWn3q5XZoskFY",
  authDomain: "fieldwork-tracker-1755749663.firebaseapp.com",
  projectId: "fieldwork-tracker-1755749663",
  storageBucket: "fieldwork-tracker-1755749663.firebasestorage.app",
  messagingSenderId: "1035182486687",
  appId: "1:1035182486687:web:7266605ca6a633d7159eaa"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirebase() {
  try {
    console.log('Testing Firebase connection...');
    
    const testActivity = {
      title: "テスト活動",
      date: new Date(),
      distance: 5.2,
      elevationGain: 150,
      weather: "sunny",
      participants: ["田中", "佐藤"],
      fieldNotes: "Firebase接続テスト",
      gpxData: [],
      photos: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'activities'), testActivity);
    console.log('✅ Firebase connected successfully!');
    console.log('Document written with ID:', docRef.id);
    console.log('Check Firebase Console: https://console.firebase.google.com/project/fieldwork-tracker-1755749663/firestore');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    process.exit(1);
  }
}

testFirebase();