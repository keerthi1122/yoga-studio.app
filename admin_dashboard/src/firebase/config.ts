import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBDzovox5JS3roZvxofpX8Jjei6T31i1UQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "yogastudio-2d89b.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "yogastudio-2d89b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "yogastudio-2d89b.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "799318188921",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:799318188921:web:5b7990cbcb5090c4d585a8",
};

// Singleton App init
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to local emulators if configured
const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

if (useEmulator && typeof window !== 'undefined') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('[Firebase] Connected to local Firebase Emulators');
  } catch (err) {
    console.warn('[Firebase] Emulator connection skipped or already initialized');
  }
}

export default app;

