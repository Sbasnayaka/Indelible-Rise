// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// PASTE YOUR FIREBASE CONFIG OBJECT HERE (from Step 2 of backend setup)
const firebaseConfig = {
  apiKey: "AIzaSyBVHnD-ZyPJMEr840fkeZLj4eF1v_JY-Ak",
  authDomain: "indelible-rise.firebaseapp.com",
  projectId: "indelible-rise",
  storageBucket: "indelible-rise.firebasestorage.app",
  messagingSenderId: "200841433272",
  appId: "1:200841433272:web:3f0f6eeb31d48c74e4244d",
  measurementId: "G-764FZ6DPBB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);