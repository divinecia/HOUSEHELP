"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

// Provided config
const firebaseConfig = {
  apiKey: "AIzaSyBQZsvMlcu3H8G5K7x6TMgMj-F2fEUVKWo",
  authDomain: "househelp-42493.firebaseapp.com",
  projectId: "househelp-42493",
  storageBucket: "househelp-42493.firebasestorage.app",
  messagingSenderId: "251592966595",
  appId: "1:251592966595:web:e6dbd8bf39d25808d1bd76",
  measurementId: "G-RT9TY3VS9L",
};

let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;

export async function initFirebaseAnalytics() {
  // Disable Firebase Analytics in development to avoid API key restriction errors
  if (typeof window === "undefined" || process.env.NODE_ENV === "development") {
    console.log("Firebase Analytics disabled in development");
    return null;
  }
  
  try {
    if (!app) {
      app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
    }
    if (!analytics && (await isSupported())) {
      analytics = getAnalytics(app);
    }
    return analytics;
  } catch (error) {
    console.warn("Firebase Analytics initialization failed:", error);
    return null;
  }
}
