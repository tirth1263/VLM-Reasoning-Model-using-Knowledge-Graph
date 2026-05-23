import { physicalVocabulary } from "../data/knowledgeBase";
import { normalizeText, unique } from "./text";

function includesTerm(text: string, term: string) {
  const normalized = normalizeText(text);
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\s)${escaped.replace(/\s+/g, "\\s+")}s?(\\s|$)`).test(normalized);
}

export function extractPhysicalTerms(text: string) {
  const terms = physicalVocabulary.filter((term) => includesTerm(text, term));
  const expanded = terms.flatMap((term) => {
    if (term === "ethyl alcohol") return ["ethyl alcohol", "alcohol"];
    if (term === "wire") return ["wire", "copper", "plastic"];
    return [term];
  });
  return unique(expanded);
}

export function describeImageLocally(file?: File | null, imageDescription?: string) {
  const fileText = file?.name ? file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]/g, " ") : "";
  const cues = [imageDescription, fileText].filter(Boolean).join(". ");
  if (!cues) {
    return "No image description was provided. The model will ground objects from the question text.";
  }
  const objects = extractPhysicalTerms(cues);
  if (objects.length === 0) return cues;
  return `${cues}. Detected physical cues include ${objects.join(", ")}.`;
}

export function groundObjects(question: string, imageDescription: string) {
  const fromImage = extractPhysicalTerms(imageDescription);
  const fromQuestion = extractPhysicalTerms(question);
  const combined = unique([...fromImage, ...fromQuestion]);
  return { fromImage, fromQuestion, combined };
}
