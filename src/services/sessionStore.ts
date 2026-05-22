import { addDoc, collection, getDocs, limit, query, serverTimestamp, where } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { User } from "firebase/auth";
import { db, storage } from "../lib/firebase";
import type { EvaluationRun, ReasoningResult } from "../types";

const sessions = collection(db, "reasoningSessions");
const evaluations = collection(db, "evaluationRuns");

function stripUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function saveReasoningSession(user: User, result: ReasoningResult, imageFile?: File | null) {
  let imageUrl = "";
  let imageUploadError = "";

  if (imageFile) {
    try {
      const safeName = imageFile.name.replace(/[^a-z0-9.-]/gi, "_");
      const imageRef = ref(storage, `users/${user.uid}/reasoning-images/${Date.now()}-${safeName}`);
      await uploadBytes(imageRef, imageFile, { contentType: imageFile.type });
      imageUrl = await getDownloadURL(imageRef);
    } catch (error) {
      imageUploadError = (error as Error).message;
    }
  }

  const doc = await addDoc(
    sessions,
    stripUndefined({
      ...result,
      imageUrl,
      imageUploadError,
      userId: user.uid,
      userEmail: user.email,
      createdAt: serverTimestamp(),
      createdAtClient: result.createdAt,
    }),
  );

  return { id: doc.id, imageUrl, imageUploadError };
}

export async function loadRecentSessions(user: User) {
  const snapshot = await getDocs(query(sessions, where("userId", "==", user.uid), limit(12)));
  return snapshot.docs
    .map((doc) => ({ ...(doc.data() as ReasoningResult), id: doc.id }))
    .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
}

export async function saveEvaluationRun(user: User, run: EvaluationRun) {
  const doc = await addDoc(
    evaluations,
    stripUndefined({
      ...run,
      userId: user.uid,
      userEmail: user.email,
      createdAt: serverTimestamp(),
      createdAtClient: run.createdAt,
    }),
  );
  return doc.id;
}
