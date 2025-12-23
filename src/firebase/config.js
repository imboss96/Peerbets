import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

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

// Initialize reCAPTCHA verifier globally
export const initializeRecaptcha = () => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
      size: 'invisible',
      callback: (response) => {
        console.log('reCAPTCHA verified');
      }
    }, auth);
  }
  return window.recaptchaVerifier;
};

// Phone Auth functions
export const sendOTPToPhone = async (phoneNumber) => {
  try {
    const verifier = initializeRecaptcha();
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    window.confirmationResult = confirmationResult;
    return { success: true, message: 'OTP sent to your phone' };
  } catch (error) {
    console.error('Send OTP error:', error);
    return { success: false, error: error.message };
  }
};

export const verifyOTPCode = async (otpCode) => {
  try {
    if (!window.confirmationResult) {
      return { success: false, error: 'No confirmation result. Send OTP first.' };
    }
    const result = await window.confirmationResult.confirm(otpCode);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Verify OTP error:', error);
    return { success: false, error: error.message };
  }
};

// Export app as default
export default app;

