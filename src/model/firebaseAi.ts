import { generativeModel } from "../lib/firebase";
import type { Choice, ModelAnswer } from "../types";
import { parseChoiceLetter } from "./text";

async function fileToGenerativePart(file: File) {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const value = String(reader.result ?? "");
      resolve(value.split(",")[1] ?? value);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type || "image/jpeg",
    },
  };
}

function readResponseText(result: unknown) {
  const response = (result as { response?: unknown })?.response;
  if (response && typeof (response as { text?: unknown }).text === "function") {
    return String((response as { text: () => string }).text());
  }
  if (response && typeof (response as { text?: unknown }).text === "string") {
    return String((response as { text: string }).text);
  }
  if (typeof (result as { text?: unknown })?.text === "string") {
    return String((result as { text: string }).text);
  }
  return "";
}

export async function describeImageWithFirebaseAi(file: File) {
  const imagePart = await fileToGenerativePart(file);
  const result = await generativeModel.generateContent([
    "Describe the physical objects in this image. List visible materials, likely properties, and any physical interactions. Keep it under 80 words.",
    imagePart,
  ]);
  return readResponseText(result);
}

export async function answerWithFirebaseAi(prompt: string, choices: Choice[], evidence: string[]): Promise<ModelAnswer> {
  const result = await generativeModel.generateContent([
    `${prompt}\nReturn a concise answer. Start with the answer letter when choices are provided.`,
  ]);
  const answer = readResponseText(result).trim();
  const letter = parseChoiceLetter(answer, choices);
  return {
    answer,
    letter,
    confidence: letter ? 0.78 : 0.58,
    reasoning: answer || "Firebase AI returned an empty response.",
    evidence,
    source: "firebase-ai",
  };
}
