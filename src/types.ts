export type ChoiceId = "A" | "B" | "C" | "D" | "E";

export type Choice = {
  id: ChoiceId;
  text: string;
};

export type KnowledgeFact = {
  id: string;
  subject: string;
  relation: "HasProperty" | "CapableOf" | "UsedFor" | "MadeOf" | "Causes" | "RelatedTo";
  object: string;
  weight: number;
  tags: string[];
};

export type RetrievedFact = KnowledgeFact & {
  score: number;
  reason: string;
};

export type PhysicsRule = {
  id: string;
  category: "shadow" | "buoyancy" | "elasticity" | "gravity" | "heat" | "reflection" | "magnetism";
  triggerTerms: string[];
  statement: string;
  explanation: string;
};

export type FiredRule = PhysicsRule & {
  score: number;
  matchedTerms: string[];
};

export type ModelAnswer = {
  answer: string;
  letter?: ChoiceId;
  confidence: number;
  reasoning: string;
  evidence: string[];
  source: "local-symbolic" | "firebase-ai" | "fallback";
};

export type WebContextSource = {
  id: string;
  title: string;
  url: string;
  query: string;
  extract: string;
  source: "wikipedia";
  score: number;
};

export type ReasoningInput = {
  question: string;
  choices: Choice[];
  imageFile?: File | null;
  imageDescription?: string;
  useFirebaseAi: boolean;
  useWebContext: boolean;
};

export type ReasoningResult = {
  id: string;
  createdAt: string;
  question: string;
  choices: Choice[];
  imageName?: string;
  imageDescription: string;
  detectedObjects: {
    fromImage: string[];
    fromQuestion: string[];
    combined: string[];
  };
  webContext: WebContextSource[];
  contextQuestions: string[];
  retrievedFacts: RetrievedFact[];
  firedRules: FiredRule[];
  prompts: {
    baseline: string;
    augmented: string;
  };
  baselineAnswer: ModelAnswer;
  augmentedAnswer: ModelAnswer;
  diagnostics: {
    factCoverage: number;
    ruleCoverage: number;
    webContextCoverage: number;
    kgLift: number;
    method: string;
  };
};

export type EvaluationCondition = "baseline" | "randomKg" | "kgOnly" | "fullSystem";

export type BenchmarkCase = {
  id: string;
  category: string;
  question: string;
  choices: Choice[];
  answer: ChoiceId;
  imageDescription?: string;
};

export type EvaluationRow = {
  condition: EvaluationCondition;
  label: string;
  correct: number;
  total: number;
  accuracy: number;
  delta: number;
};

export type EvaluationRun = {
  id: string;
  createdAt: string;
  rows: EvaluationRow[];
  cases: Array<{
    id: string;
    category: string;
    expected: ChoiceId;
    predictions: Record<EvaluationCondition, ChoiceId | "X">;
  }>;
};
