import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBYuEbHVbs-9eXqo9Ds92C6HR70__tJbV0",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "sparkbet-af742.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "sparkbet-af742",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "sparkbet-af742.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "63170914902",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:63170914902:web:121f41f5217f99ab3869f7",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-5GNLZTDDF0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Authentication
export const auth = getAuth(app);

// Initialize Storage
export const storage = getStorage(app);

// Export app as default
export default app;

