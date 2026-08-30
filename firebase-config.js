import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDTCec6s4g50jxDFcp5InKaIWojZrjJgc",
  authDomain: "sohana-beauty-saloon.firebaseapp.com",
  projectId: "sohana-beauty-saloon",
  storageBucket: "sohana-beauty-saloon.firebasestorage.app",
  messagingSenderId: "454248308554",
  appId: "1:454248308554:web:51044f7cf825824ffcebb3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
