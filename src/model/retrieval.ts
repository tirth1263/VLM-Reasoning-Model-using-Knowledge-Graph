import { conceptNetSeedFacts, randomPhysicalFacts } from "../data/knowledgeBase";
import type { KnowledgeFact, RetrievedFact } from "../types";
import { lexicalOverlap, tokenize, unique } from "./text";

const relationBoost: Record<KnowledgeFact["relation"], number> = {
  HasProperty: 0.2,
  CapableOf: 0.17,
  UsedFor: 0.16,
  MadeOf: 0.12,
  Causes: 0.14,
  RelatedTo: 0.04,
};

function factText(fact: KnowledgeFact) {
  return `${fact.subject} ${fact.relation} ${fact.object} ${fact.tags.join(" ")}`;
}

function scoreFact(fact: KnowledgeFact, question: string, objects: string[]) {
  const exactObject = objects.includes(fact.subject) ? 0.42 : 0;
  const questionScore = lexicalOverlap(question, factText(fact)) * 0.34;
  const tagScore = fact.tags.some((tag) => tokenize(question).includes(tag)) ? 0.1 : 0;
  return fact.weight * 0.28 + exactObject + questionScore + relationBoost[fact.relation] + tagScore;
}

export function retrieveFacts(question: string, objects: string[], topK = 6): RetrievedFact[] {
  const objectSet = new Set(objects);
  const candidates = conceptNetSeedFacts.filter((fact) => objectSet.has(fact.subject));
  const fallbackCandidates = candidates.length > 0 ? candidates : conceptNetSeedFacts;

  return fallbackCandidates
    .map((fact) => ({
      ...fact,
      score: scoreFact(fact, question, objects),
      reason: objectSet.has(fact.subject) ? `matched detected object "${fact.subject}"` : "semantic fallback",
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function retrieveRandomFacts(question: string, count = 5): RetrievedFact[] {
  const tokens = unique(tokenize(question));
  return randomPhysicalFacts.slice(0, count).map((fact, index) => ({
    ...fact,
    score: 0.15 - index * 0.01,
    reason: tokens.length ? "random KG control fact" : "random filler fact",
  }));
}

export function factsToEvidence(facts: KnowledgeFact[]) {
  return facts.map((fact) => `${fact.subject} ${fact.relation}: ${fact.object}`);
}
