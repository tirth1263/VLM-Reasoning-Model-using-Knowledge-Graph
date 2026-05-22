import type { Choice, EvaluationCondition, FiredRule, ModelAnswer, ReasoningInput, ReasoningResult, RetrievedFact } from "../types";
import { describeImageWithFirebaseAi, answerWithFirebaseAi } from "./firebaseAi";
import { describeImageLocally, groundObjects } from "./grounding";
import { buildAugmentedPrompt, buildBaselinePrompt } from "./prompts";
import { firePhysicsRules } from "./physicsRules";
import { factsToEvidence, retrieveFacts, retrieveRandomFacts } from "./retrieval";
import { lexicalOverlap, parseChoiceLetter, sentence, tokenize } from "./text";

type AnswerOptions = {
  condition: EvaluationCondition;
  facts: RetrievedFact[];
  rules: FiredRule[];
};

const intentHints = [
  { match: ["electric", "wiring", "wire", "current", "conduct"], hints: ["conduct", "electric", "current", "insulator"] },
  { match: ["heat", "hot", "cold", "thermal"], hints: ["heat", "hot", "cold", "thermal"] },
  { match: ["state", "solid", "liquid", "gas"], hints: ["solid", "liquid", "gas"] },
  { match: ["bounce", "elastic", "drop", "break", "shatter"], hints: ["bounce", "elastic", "shatter", "break", "brittle"] },
  { match: ["shadow", "sun", "light"], hints: ["opposite", "away", "light", "shadow"] },
  { match: ["float", "sink", "water", "dense"], hints: ["float", "sink", "dense", "water"] },
  { match: ["gravity", "fall", "drop", "heavy", "light"], hints: ["same", "rate", "acceleration", "downward"] },
  { match: ["mirror", "reflection", "ray"], hints: ["reflection", "incidence", "angle"] },
  { match: ["magnet", "magnetic", "attract"], hints: ["iron", "steel", "magnet"] },
];

function evidenceText(facts: RetrievedFact[], rules: FiredRule[]) {
  return [
    ...factsToEvidence(facts),
    ...rules.map((rule) => `${rule.statement} ${rule.explanation}`),
  ].join(" ");
}

function scoreChoice(choice: Choice, question: string, facts: RetrievedFact[], rules: FiredRule[], condition: EvaluationCondition) {
  const evidence = evidenceText(facts, rules);
  const choiceText = choice.text.toLowerCase();
  let score = lexicalOverlap(choice.text, `${question} ${evidence}`) * 1.2;

  facts.forEach((fact) => {
    score += lexicalOverlap(choice.text, `${fact.subject} ${fact.object} ${fact.tags.join(" ")}`) * fact.score;
  });

  rules.forEach((rule) => {
    score += lexicalOverlap(choice.text, `${rule.statement} ${rule.explanation}`) * (0.8 + rule.score);
  });

  const qTokens = tokenize(question);
  intentHints.forEach((intent) => {
    if (intent.match.some((term) => qTokens.includes(term))) {
      intent.hints.forEach((hint) => {
        if (choiceText.includes(hint)) score += condition === "baseline" ? 0.05 : 0.24;
      });
    }
  });

  if (condition === "baseline") {
    score += lexicalOverlap(choice.text, question) * 0.35;
  }

  return score;
}

function factSentence(fact: RetrievedFact) {
  switch (fact.relation) {
    case "UsedFor":
      return `${fact.subject} is used for ${fact.object}`;
    case "HasProperty":
      return `${fact.subject} has the physical property: ${fact.object}`;
    case "CapableOf":
      return `${fact.subject} is capable of ${fact.object}`;
    case "MadeOf":
      return `${fact.subject} is made of or contains ${fact.object}`;
    case "Causes":
      return `${fact.subject} can cause ${fact.object}`;
    default:
      return `${fact.subject} is related to ${fact.object}`;
  }
}

function answerFreeResponse(question: string, facts: RetrievedFact[], rules: FiredRule[], condition: EvaluationCondition): ModelAnswer {
  const topFact = facts[0];
  const topRule = rules[0];
  const evidence = [
    ...facts.slice(0, 4).map((fact) => `${fact.subject} ${fact.relation}: ${fact.object}`),
    ...rules.slice(0, 3).map((rule) => rule.statement),
  ];

  if (condition === "baseline") {
    const answer = "The baseline model answers from the image/question alone, so it may miss material-specific physical properties without retrieved KG evidence.";
    return {
      answer,
      confidence: 0.34,
      reasoning: answer,
      evidence,
      source: "local-symbolic",
    };
  }

  if (topRule && topFact) {
    const answer = `${topRule.statement} The knowledge graph also supports this: ${sentence(factSentence(topFact))}`;
    return {
      answer,
      confidence: 0.82,
      reasoning: `Combined the strongest physics rule with the top ConceptNet-style fact for the question: "${question}"`,
      evidence,
      source: "local-symbolic",
    };
  }

  if (topFact) {
    const answer = `${sentence(factSentence(topFact))} This retrieved fact directly grounds the answer in a physical property or use.`;
    return {
      answer,
      confidence: 0.76,
      reasoning: `Used the top retrieved ConceptNet-style fact for the detected object "${topFact.subject}".`,
      evidence,
      source: "local-symbolic",
    };
  }

  if (topRule) {
    const answer = `${topRule.statement} ${topRule.explanation}`;
    return {
      answer,
      confidence: 0.72,
      reasoning: `Used a hand-written physics rule because it matched the question context.`,
      evidence,
      source: "local-symbolic",
    };
  }

  const answer = "I need more visual or textual grounding to answer reliably.";
  return {
    answer,
    confidence: 0.32,
    reasoning: answer,
    evidence,
    source: "local-symbolic",
  };
}

function answerLocally(question: string, choices: Choice[], options: AnswerOptions): ModelAnswer {
  const ranked = choices
    .map((choice) => ({
      choice,
      score: scoreChoice(choice, question, options.facts, options.rules, options.condition),
    }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const runnerUp = ranked[1];
  const evidence = [
    ...options.facts.slice(0, 4).map((fact) => `${fact.subject} ${fact.relation}: ${fact.object}`),
    ...options.rules.slice(0, 3).map((rule) => rule.statement),
  ];

  if (choices.length > 0 && best) {
    const margin = Math.max(0, best.score - (runnerUp?.score ?? 0));
    const confidence = Math.min(0.94, Math.max(0.38, 0.48 + margin * 0.28 + evidence.length * 0.025));
    const reasoning = evidence.length
      ? `Selected ${best.choice.id} because the strongest retrieved evidence says ${sentence(evidence[0].toLowerCase())}`
      : `Selected ${best.choice.id} using the plain VQA prompt and shallow question-choice similarity.`;

    return {
      answer: `${best.choice.id}. ${best.choice.text}`,
      letter: best.choice.id,
      confidence,
      reasoning,
      evidence,
      source: "local-symbolic",
    };
  }

  return answerFreeResponse(question, options.facts, options.rules, options.condition);
}

export async function runReasoning(input: ReasoningInput): Promise<ReasoningResult> {
  const id = crypto.randomUUID();
  let imageDescription = describeImageLocally(input.imageFile, input.imageDescription);
  let method = "Local KG-symbolic reasoner";

  if (input.useFirebaseAi && input.imageFile) {
    try {
      const cloudDescription = await describeImageWithFirebaseAi(input.imageFile);
      if (cloudDescription.trim()) {
        imageDescription = cloudDescription.trim();
        method = "Firebase AI Logic VLM + KG-symbolic augmentation";
      }
    } catch (error) {
      method = `Local fallback after Firebase AI image grounding error: ${(error as Error).message}`;
    }
  }

  const detectedObjects = groundObjects(input.question, imageDescription);
  const retrievedFacts = retrieveFacts(input.question, detectedObjects.combined, 6);
  const firedRules = firePhysicsRules(input.question, detectedObjects.combined);
  const prompts = {
    baseline: buildBaselinePrompt(input.question, input.choices),
    augmented: buildAugmentedPrompt(input.question, input.choices, retrievedFacts, firedRules),
  };

  let baselineAnswer = answerLocally(input.question, input.choices, {
    condition: "baseline",
    facts: [],
    rules: [],
  });
  let augmentedAnswer = answerLocally(input.question, input.choices, {
    condition: "fullSystem",
    facts: retrievedFacts,
    rules: firedRules,
  });

  if (input.useFirebaseAi) {
    try {
      baselineAnswer = await answerWithFirebaseAi(prompts.baseline, input.choices, []);
      augmentedAnswer = await answerWithFirebaseAi(
        prompts.augmented,
        input.choices,
        [...retrievedFacts.map((fact) => `${fact.subject}: ${fact.object}`), ...firedRules.map((rule) => rule.statement)],
      );
    } catch (error) {
      method = `${method}; answer generation used local fallback after Firebase AI error: ${(error as Error).message}`;
    }
  }

  return {
    id,
    createdAt: new Date().toISOString(),
    question: input.question,
    choices: input.choices,
    imageName: input.imageFile?.name,
    imageDescription,
    detectedObjects,
    retrievedFacts,
    firedRules,
    prompts,
    baselineAnswer,
    augmentedAnswer,
    diagnostics: {
      factCoverage: retrievedFacts.length,
      ruleCoverage: firedRules.length,
      kgLift: augmentedAnswer.confidence - baselineAnswer.confidence,
      method,
    },
  };
}

export function runCondition(question: string, choices: Choice[], imageDescription: string, condition: EvaluationCondition) {
  const detected = groundObjects(question, imageDescription);
  const facts = condition === "randomKg" ? retrieveRandomFacts(question, 5) : condition === "baseline" ? [] : retrieveFacts(question, detected.combined, 6);
  const rules = condition === "fullSystem" ? firePhysicsRules(question, detected.combined) : [];
  return answerLocally(question, choices, { condition, facts, rules });
}

export function parseLocalLetter(answer: ModelAnswer, choices: Choice[]) {
  return answer.letter ?? parseChoiceLetter(answer.answer, choices);
}
