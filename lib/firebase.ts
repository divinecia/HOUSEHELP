"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
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
