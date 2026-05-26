import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC5eqRAZ5DXKjssZnYEPWHaKoThksQuEMY",
  authDomain: "aidencare.co",
  projectId: "aiden-12acb",
  storageBucket: "aiden-12acb.firebasestorage.app",
  messagingSenderId: "90168103816",
  appId: "1:90168103816:web:8d15ea56231852b413203d",
  measurementId: "G-QDP5W8SPCT"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// inMemoryPersistence avoids IndexedDB/localStorage issues in Capacitor WebView
setPersistence(auth, inMemoryPersistence).catch(console.error);
export const db = getFirestore(app);
export const storage = getStorage(app);
