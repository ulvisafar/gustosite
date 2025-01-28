// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDy_z5TxiI0CxoaEnwvGQfM-KhYmaGb1RQ",
  authDomain: "gustopizza-75df6.firebaseapp.com",
  projectId: "gustopizza-75df6",
  storageBucket: "gustopizza-75df6.firebasestorage.app",
  messagingSenderId: "79957512960",
  appId: "1:79957512960:web:922878a84a9b43d07099e5",
  measurementId: "G-6T4M7ZCTQ0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);