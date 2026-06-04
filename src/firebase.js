import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDFCjzWOS6t5A99avXcqgAiKZhvExxwFso",
  authDomain: "loan-emi-tracker.firebaseapp.com",
  projectId: "loan-emi-tracker",
  storageBucket: "loan-emi-tracker.firebasestorage.app",
  messagingSenderId: "702279935578",
  appId: "1:702279935578:web:d523bd23acf90a70b1da63",
  measurementId: "G-QW5ZKQK1TE"
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
