import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import firebaseConfig from './config'; // adjust if your config is elsewhere

function ensureApp() {
  if (!getApps().length) {
    initializeApp(firebaseConfig);
    console.log('Firebase initialized (ensureApp)');
  }
  return getApp();
}

export function getDB() {
  ensureApp();
  return getFirestore();
}

export function getFns() {
  ensureApp();
  return getFunctions();
}