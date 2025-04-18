// Import Firebase SDKs
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCjoCS2A6seCZRJtcXv0k8d6zHYqOXjwR4",
  authDomain: "studentjobportal-81b3f.firebaseapp.com",
  databaseURL: "https://studentjobportal-81b3f-default-rtdb.asia-southeast1.firebasedatabase.app", // Ensure this is correct
  projectId: "studentjobportal-81b3f",
  storageBucket: "studentjobportal-81b3f.appspot.com",
  messagingSenderId: "475190315821",
  appId: "1:475190315821:web:e1ab91244fd79ac0b321a4",
  measurementId: "G-CXZV08B7QF",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export { app, db, auth };
