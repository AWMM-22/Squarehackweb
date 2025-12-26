
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Note: For a frontend app, you'd usually use the Web API Key. 
// Using your Project ID from the Service Account provided.
const firebaseConfig = {
  projectId: "squarehacks-1cfd7",
  // Placeholder values for client-side required fields
  // In production, these should be your real Firebase Web Config values
  apiKey: "AIzaSyAs-DEMO-ONLY-REPLACE-WITH-REAL-KEY", 
  authDomain: "squarehacks-1cfd7.firebaseapp.com",
  storageBucket: "squarehacks-1cfd7.appspot.com",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
