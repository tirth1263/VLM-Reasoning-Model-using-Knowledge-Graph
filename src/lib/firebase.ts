import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBFwDJJ2cQptn7_pwFP6aK1tmyeZdWDXUw",
  authDomain: "vlm-reasoning-model.firebaseapp.com",
  projectId: "vlm-reasoning-model",
  storageBucket: "vlm-reasoning-model.firebasestorage.app",
  messagingSenderId: "213423263457",
  appId: "1:213423263457:web:a97b8783374d15592f31a0",
  measurementId: "G-CHQNC95FYP",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

void isSupported().then((supported) => {
  if (supported) getAnalytics(app);
});

const ai = getAI(app, { backend: new GoogleAIBackend() });
export const generativeModel = getGenerativeModel(ai, {
  model: import.meta.env.VITE_FIREBASE_AI_MODEL || "gemini-2.5-flash",
});
