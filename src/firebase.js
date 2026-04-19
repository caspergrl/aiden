import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC5eqRAZ5DXKjssZnYEPWHaKoThksQuEMY",
  authDomain: "aiden-12acb.firebaseapp.com",
  projectId: "aiden-12acb",
  storageBucket: "aiden-12acb.firebasestorage.app",
  messagingSenderId: "90168103816",
  appId: "1:90168103816:web:8d15ea56231852b413203d",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);
export const db = getFirestore(app);
