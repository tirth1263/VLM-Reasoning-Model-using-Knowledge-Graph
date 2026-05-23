import type { Choice, FiredRule, RetrievedFact, WebContextSource } from "../types";
import { formatChoices } from "./text";

export function buildBaselinePrompt(question: string, choices: Choice[]) {
  return `${question}\n${formatChoices(choices)}\nAnswer:`;
}

export function buildAugmentedPrompt(question: string, choices: Choice[], facts: RetrievedFact[], rules: FiredRule[], webContext: WebContextSource[] = []) {
  const factBlock = facts.map((fact, index) => `${index + 1}. ${fact.subject} ${fact.relation} ${fact.object}`).join("\n");
  const ruleBlock = rules.map((rule, index) => `${index + 1}. ${rule.statement}`).join("\n");
  const webBlock = webContext.map((source, index) => `${index + 1}. ${source.title}: ${source.extract} (${source.url})`).join("\n");

  return [
    "Use the retrieved physical knowledge and web context to answer the question. If the web evidence is relevant, ground the answer in it instead of relying on memorized templates.",
    "",
    "Retrieved ConceptNet facts:",
    factBlock || "No relevant facts retrieved.",
    "",
    "Physics rules:",
    ruleBlock || "No rules fired.",
    "",
    "Web-scraped context:",
    webBlock || "No web context retrieved.",
    "",
    "Question:",
    question,
    formatChoices(choices),
    "Answer:",
  ].join("\n");
}
