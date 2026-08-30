import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDTCEc6s4g5OjxDfFCp5TnKaIWOjZrjEgc",
  authDomain: "sohana-beauty-saloon.firebaseapp.com",
  projectId: "sohana-beauty-saloon",
  storageBucket: "sohana-beauty-saloon.firebasestorage.app",
  messagingSenderId: "454248308554",
  appId: "1:454248308554:web:767d53c58fe2073ffcebb3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
