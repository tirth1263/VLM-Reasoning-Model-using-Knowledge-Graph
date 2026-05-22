import { physicsRules } from "../data/knowledgeBase";
import type { FiredRule } from "../types";
import { lexicalOverlap, normalizeText, unique } from "./text";

export function firePhysicsRules(question: string, objects: string[]): FiredRule[] {
  const context = normalizeText(`${question} ${objects.join(" ")}`);
  return physicsRules
    .map((rule) => {
      const matchedTerms = rule.triggerTerms.filter((term) => context.includes(term));
      const objectHits = matchedTerms.length / Math.max(rule.triggerTerms.length, 1);
      const questionHit = lexicalOverlap(question, `${rule.statement} ${rule.explanation}`);
      return {
        ...rule,
        matchedTerms: unique(matchedTerms),
        score: objectHits * 0.7 + questionHit * 0.3,
      };
    })
    .filter((rule) => rule.matchedTerms.length > 0 && rule.score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}
