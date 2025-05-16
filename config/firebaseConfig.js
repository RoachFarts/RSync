// config/firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { Platform } from 'react-native'; // Import Platform
import {
  initializeAuth,
  getReactNativePersistence,   // For native
  indexedDBLocalPersistence,   // For web (or browserLocalPersistence/browserSessionPersistence)
  // setPersistence // Only needed if you were to use it after initializeAuth for some reason
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";

const firebaseConfig = { // Your config details here ...
  apiKey: "AIzaSyCI3UIaRR8fCTTmpE0j2oSi5Ta0Ovbrx6o",
  authDomain: "residentsync-e4689.firebaseapp.com",
  projectId: "residentsync-e4689",
  storageBucket: "residentsync-e4689.firebasestorage.app",
  messagingSenderId: "151651788472",
  appId: "1:151651788472:web:d213096d175e82e098f64d",
  measurementId: "G-PE9R3NRWDV"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Conditionally select persistence based on platform
const persistence = Platform.OS === 'web'
  ? indexedDBLocalPersistence // Recommended for web for full persistence
  : getReactNativePersistence(ReactNativeAsyncStorage);

const auth = initializeAuth(app, {
  persistence: persistence
});

const db = getFirestore(app);
let analytics;
isAnalyticsSupported().then((isSupported) => {
  if (isSupported) {
    analytics = getAnalytics(app);
    console.log("Firebase Analytics initialized.");
  } else {
    console.log("Firebase Analytics is not supported in this environment.");
  }
});

export { app, auth, db, analytics };