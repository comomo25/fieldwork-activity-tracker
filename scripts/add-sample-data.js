// Add sample data to Firestore
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

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

async function addSampleData() {
  try {
    console.log('Adding sample activities to Firestore...');
    
    const activities = [
      {
        title: "箱根ハイキング",
        date: Timestamp.fromDate(new Date('2024-11-15')),
        distance: 12.5,
        duration: 18000,
        elevationGain: 450,
        weather: "sunny",
        participants: ["田中", "佐藤", "鈴木"],
        fieldNote: "箱根の山道を歩きました。紅葉が美しく、天気も良好でした。",
        gpxData: [
          { lat: 35.2323, lng: 139.1069, elevation: 723, time: new Date('2024-11-15T09:00:00') },
          { lat: 35.2334, lng: 139.1078, elevation: 745, time: new Date('2024-11-15T09:15:00') },
          { lat: 35.2345, lng: 139.1089, elevation: 768, time: new Date('2024-11-15T09:30:00') },
          { lat: 35.2356, lng: 139.1098, elevation: 790, time: new Date('2024-11-15T09:45:00') },
          { lat: 35.2367, lng: 139.1107, elevation: 812, time: new Date('2024-11-15T10:00:00') }
        ],
        photos: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        title: "富士山麓トレッキング",
        date: Timestamp.fromDate(new Date('2024-10-20')),
        distance: 8.3,
        duration: 14400,
        elevationGain: 320,
        weather: "cloudy",
        participants: ["山田", "伊藤"],
        fieldNote: "富士山の麓を歩きました。雲が多かったですが、時折富士山が見えました。",
        gpxData: [
          { lat: 35.3606, lng: 138.7274, elevation: 1200, time: new Date('2024-10-20T08:00:00') },
          { lat: 35.3617, lng: 138.7285, elevation: 1220, time: new Date('2024-10-20T08:20:00') },
          { lat: 35.3628, lng: 138.7296, elevation: 1245, time: new Date('2024-10-20T08:40:00') },
          { lat: 35.3639, lng: 138.7307, elevation: 1268, time: new Date('2024-10-20T09:00:00') }
        ],
        photos: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        title: "鎌倉古道散策",
        date: Timestamp.fromDate(new Date('2024-09-05')),
        distance: 6.2,
        duration: 10800,
        elevationGain: 150,
        weather: "sunny",
        participants: ["高橋"],
        fieldNote: "鎌倉の古道を散策。歴史的な寺社を巡りながらのフィールドワーク。",
        gpxData: [
          { lat: 35.3192, lng: 139.5466, elevation: 25, time: new Date('2024-09-05T10:00:00') },
          { lat: 35.3203, lng: 139.5477, elevation: 35, time: new Date('2024-09-05T10:30:00') },
          { lat: 35.3214, lng: 139.5488, elevation: 45, time: new Date('2024-09-05T11:00:00') },
          { lat: 35.3225, lng: 139.5499, elevation: 55, time: new Date('2024-09-05T11:30:00') }
        ],
        photos: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
    ];

    for (const activity of activities) {
      const docRef = await addDoc(collection(db, 'activities'), activity);
      console.log('Added activity:', activity.title, 'with ID:', docRef.id);
    }

    console.log('✅ Sample data added successfully!');
    console.log('Check your app at http://localhost:3003');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
    process.exit(1);
  }
}

addSampleData();