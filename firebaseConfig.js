// firebaseConfig.js
// ========================================================
// ✅ Firebase Config (Expo + React Native SAFE VERSION)
// ========================================================

import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// --------------------------------------------------------
// 🔧 Firebase Config Object (PUBLIC KEYS – SAFE)
// --------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAuEkS3oEghE2W3iPeKi5HDFR2I5UanJ3Y",
  authDomain: "fitnova-485a4.firebaseapp.com",
  projectId: "fitnova-485a4",
  storageBucket: "fitnova-485a4.firebasestorage.app",
  messagingSenderId: "135486198744",
  appId: "1:135486198744:web:fdfcafed93f3edf7d718ad",
  measurementId: "G-Z214H7T3DX",
};

// --------------------------------------------------------
// 🚀 Initialize Firebase App (Prevents duplicates)
// --------------------------------------------------------
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// --------------------------------------------------------
// 👤 Initialize Firebase Auth (Persistent Login)
// --------------------------------------------------------
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// --------------------------------------------------------
// 📦 Firestore + Storage
// --------------------------------------------------------
export const db = getFirestore(app);
export const storage = getStorage(app);

// --------------------------------------------------------
// 📤 Export App
// --------------------------------------------------------
export { app as firebaseApp };
export default app;
