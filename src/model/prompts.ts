import type { Choice, FiredRule, RetrievedFact } from "../types";
import { formatChoices } from "./text";

export function buildBaselinePrompt(question: string, choices: Choice[]) {
  return `${question}\n${formatChoices(choices)}\nAnswer:`;
}

export function buildAugmentedPrompt(question: string, choices: Choice[], facts: RetrievedFact[], rules: FiredRule[]) {
  const factBlock = facts.map((fact, index) => `${index + 1}. ${fact.subject} ${fact.relation} ${fact.object}`).join("\n");
  const ruleBlock = rules.map((rule, index) => `${index + 1}. ${rule.statement}`).join("\n");

  return [
    "Use the retrieved physical knowledge to answer the multiple-choice question.",
    "",
    "Retrieved ConceptNet facts:",
    factBlock || "No relevant facts retrieved.",
    "",
    "Physics rules:",
    ruleBlock || "No rules fired.",
    "",
    "Question:",
    question,
    formatChoices(choices),
    "Answer:",
  ].join("\n");
}
