import { benchmarkCases } from "../data/benchmark";
import type { EvaluationCondition, EvaluationRun, EvaluationRow } from "../types";
import { parseLocalLetter, runCondition } from "./localReasoner";

const labels: Record<EvaluationCondition, string> = {
  baseline: "Baseline, no KG",
  randomKg: "Random KG control",
  kgOnly: "ConceptNet KG only",
  fullSystem: "KG + physics rules",
};

const conditions: EvaluationCondition[] = ["baseline", "randomKg", "kgOnly", "fullSystem"];

export function runEvaluation(): EvaluationRun {
  const cases = benchmarkCases.map((item) => {
    const predictions = conditions.reduce(
      (acc, condition) => {
        const answer = runCondition(item.question, item.choices, item.imageDescription ?? "", condition);
        acc[condition] = parseLocalLetter(answer, item.choices) ?? "X";
        return acc;
      },
      {} as EvaluationRun["cases"][number]["predictions"],
    );

    return {
      id: item.id,
      category: item.category,
      expected: item.answer,
      predictions,
    };
  });

  const baselineCorrect = cases.filter((item) => item.predictions.baseline === item.expected).length;

  const rows: EvaluationRow[] = conditions.map((condition) => {
    const correct = cases.filter((item) => item.predictions[condition] === item.expected).length;
    const total = cases.length;
    const accuracy = correct / total;
    return {
      condition,
      label: labels[condition],
      correct,
      total,
      accuracy,
      delta: accuracy - baselineCorrect / total,
    };
  });

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    rows,
    cases,
  };
}
