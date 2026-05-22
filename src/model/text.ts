import type { Choice, ChoiceId } from "../types";

const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "because",
  "by",
  "does",
  "for",
  "from",
  "how",
  "in",
  "inside",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "what",
  "when",
  "where",
  "which",
  "why",
  "with",
]);

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

export function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

export function lexicalOverlap(a: string, b: string) {
  const left = new Set(tokenize(a));
  const right = new Set(tokenize(b));
  if (left.size === 0 || right.size === 0) return 0;
  let hits = 0;
  left.forEach((token) => {
    if (right.has(token)) hits += 1;
  });
  return hits / Math.sqrt(left.size * right.size);
}

export function formatChoices(choices: Choice[]) {
  return choices.map((choice) => `${choice.id}. ${choice.text}`).join("\n");
}

export function parseChoiceLetter(text: string, choices: Choice[]): ChoiceId | undefined {
  const valid = new Set(choices.map((choice) => choice.id));
  const direct = text.match(/\b([A-E])\b/i)?.[1]?.toUpperCase() as ChoiceId | undefined;
  if (direct && valid.has(direct)) return direct;

  const normalized = normalizeText(text);
  const best = choices
    .map((choice) => ({
      id: choice.id,
      score: lexicalOverlap(normalized, choice.text),
    }))
    .sort((a, b) => b.score - a.score)[0];

  return best?.score > 0.42 ? best.id : undefined;
}

export function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function sentence(value: string) {
  if (!value) return value;
  return value.endsWith(".") ? value : `${value}.`;
}
