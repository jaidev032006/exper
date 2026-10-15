import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDg4DpVI1-Gz10Vm8qDymbQmo3UNevKSio",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "exper-04.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "exper-04",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "exper-04.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "283810219548",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:283810219548:web:d570475e482bb96d6f01d9",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-0TS3E5M3HY"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Export auth methods
export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
};
export type { FirebaseUser };
