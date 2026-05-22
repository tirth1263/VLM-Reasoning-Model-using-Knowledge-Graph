import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAufLzL0ESDa1iabnSvyLQM6fAvHcNE9FQ",
  authDomain: "vlm-reasoning-model-b760f.firebaseapp.com",
  projectId: "vlm-reasoning-model-b760f",
  storageBucket: "vlm-reasoning-model-b760f.firebasestorage.app",
  messagingSenderId: "957587924968",
  appId: "1:957587924968:web:0bc8a145473616c01fe65d",
  measurementId: "G-00NDWLR0ZH",
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
