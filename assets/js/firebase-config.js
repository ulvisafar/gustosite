// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
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
const db = getFirestore(app);

export { db, collection, addDoc, doc, onSnapshot }; 

