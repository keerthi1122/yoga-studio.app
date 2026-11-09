import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  setDoc
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  getDownloadURL
} from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBDzovox5JS3roZvxofpX8Jjei6T31i1UQ",
  authDomain: "yogastudio-2d89b.firebaseapp.com",
  projectId: "yogastudio-2d89b",
  storageBucket: "yogastudio-2d89b.firebasestorage.app",
  messagingSenderId: "799318188921",
  appId: "1:799318188921:web:5b7990cbcb5090c4d585a8",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

async function runLiveChecks() {
  console.log('--- TEST 1: Firebase Auth Live Connectivity ---');
  // Attempt invalid login
  try {
    await signInWithEmailAndPassword(auth, 'nonexistent_test_user@pranayoga.com', 'InvalidPassword123!');
    console.log('UNEXPECTED: Login succeeded with nonexistent credentials');
  } catch (err) {
    console.log('Auth check (invalid login): rejected as expected with code:', err.code, '| message:', err.message);
  }

  console.log('\n--- TEST 2: Firestore Live Connectivity ---');
  try {
    const classesSnapshot = await getDocs(collection(db, 'classes'));
    console.log('Firestore check: successfully connected to collection "classes". Docs count:', classesSnapshot.size);
  } catch (err) {
    console.log('Firestore check error code:', err.code, '| message:', err.message);
  }

  console.log('\n--- TEST 3: Cloud Storage Live Connectivity ---');
  try {
    const testRef = storageRef(storage, 'instructor_photos/placeholder.jpg');
    await getDownloadURL(testRef);
    console.log('Storage check: successfully reached storage bucket');
  } catch (err) {
    console.log('Storage check response code:', err.code, '| message:', err.message);
  }
}

runLiveChecks().then(() => {
  console.log('\nInitial live check completed.');
  process.exit(0);
}).catch(err => {
  console.error('Fatal live check error:', err);
  process.exit(1);
});

