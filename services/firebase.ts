import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  User,
  ConfirmationResult,
  Auth,
} from "firebase/auth";

export type { ConfirmationResult } from "firebase/auth";

// Firebase configuration - Replace with your own config from Firebase Console
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "squarehacks-1cfd7.firebaseapp.com",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "squarehacks-1cfd7",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "squarehacks-1cfd7.appspot.com",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || "",
};

// Check if Firebase is properly configured
const isFirebaseConfigured = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";

// Initialize Firebase only if configured
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

try {
  if (isFirebaseConfigured) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log("Firebase initialized successfully");
  } else {
    console.warn("Firebase not configured. Running in demo mode. Add your Firebase config to .env file.");
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { auth };

// Check if Firebase is ready
export function isFirebaseReady(): boolean {
  return auth !== null;
}

// Email/Password login (for ASHA workers and Doctors)
export async function loginWithEmail(email: string, password: string): Promise<User> {
  if (!auth) {
    // Demo mode - simulate successful login
    console.log("Demo mode: Simulating login for", email);
    return { email, uid: "demo-user" } as User;
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

// Email/Password registration
export async function registerWithEmail(email: string, password: string): Promise<User> {
  if (!auth) {
    return { email, uid: "demo-user" } as User;
  }
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

// Phone number login (for Patients)
let recaptchaVerifier: RecaptchaVerifier | null = null;

export function setupRecaptcha(containerId: string): RecaptchaVerifier | null {
  if (!auth) return null;
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved
      },
    });
  }
  return recaptchaVerifier;
}

export async function sendOTP(phoneNumber: string, containerId: string): Promise<ConfirmationResult | null> {
  if (!auth) {
    // Demo mode - simulate OTP sent
    console.log("Demo mode: Simulating OTP send to", phoneNumber);
    return { confirm: async () => ({ user: { phoneNumber, uid: "demo-user" } as User }) } as unknown as ConfirmationResult;
  }
  const verifier = setupRecaptcha(containerId);
  if (!verifier) return null;
  return signInWithPhoneNumber(auth, phoneNumber, verifier);
}

export async function verifyOTP(confirmationResult: ConfirmationResult, otp: string): Promise<User> {
  const userCredential = await confirmationResult.confirm(otp);
  return userCredential.user;
}

// Logout
export async function logout(): Promise<void> {
  if (!auth) {
    console.log("Demo mode: Simulating logout");
    return;
  }
  await signOut(auth);
}

// Auth state listener
export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (!auth) {
    // Demo mode - immediately call back with null (not logged in)
    setTimeout(() => callback(null), 0);
    return () => {}; // Return empty unsubscribe function
  }
  return onAuthStateChanged(auth, callback);
}

// Get current user
export function getCurrentUser(): User | null {
  if (!auth) return null;
  return auth.currentUser;
}
