import { ArrowRight, CheckCircle2, Cpu, Eye, FileText, GitBranch, Globe2, HelpCircle, ListChecks, Network, ShieldCheck } from "lucide-react";
import type { FiredRule, ModelAnswer, ReasoningResult, RetrievedFact, WebContextSource } from "../types";

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function inferTopic(result: ReasoningResult) {
  const ruleTopic = result.firedRules[0]?.category;
  const factTopic = result.retrievedFacts[0]?.tags[0];
  return (ruleTopic || factTopic || "physical object properties").replace(/-/g, " ");
}

function EmptyValue({ children }: { children: string }) {
  return <span className="empty-value">{children}</span>;
}

function AnswerCard({ title, badge, answer }: { title: string; badge: string; answer: ModelAnswer }) {
  return (
    <article className="answer-card">
      <div className="answer-card-header">
        <span>{badge}</span>
        <strong>{title}</strong>
      </div>
      <h3>{answer.answer}</h3>
      <p>{answer.reasoning}</p>
    </article>
  );
}

function FactList({ facts }: { facts: RetrievedFact[] }) {
  if (!facts.length) return <EmptyValue>No ConceptNet facts retrieved yet.</EmptyValue>;
  return (
    <div className="fact-list">
      {facts.map((fact) => (
        <div className="fact-row" key={fact.id}>
          <strong>{fact.subject}</strong>
          <span>{fact.relation}</span>
          <em>{fact.object}</em>
        </div>
      ))}
    </div>
  );
}

function RuleList({ rules }: { rules: FiredRule[] }) {
  if (!rules.length) return <EmptyValue>No specific physics rules matched.</EmptyValue>;
  return (
    <div className="rule-list">
      {rules.map((rule) => (
        <div className="rule-row" key={rule.id}>
          <CheckCircle2 size={16} />
          <span>{rule.statement}</span>
        </div>
      ))}
    </div>
  );
}

function WebSourceList({ sources }: { sources: WebContextSource[] }) {
  if (!sources.length) return <EmptyValue>No web context retrieved for this run.</EmptyValue>;
  return (
    <div className="web-source-list">
      {sources.map((source) => (
        <a href={source.url} target="_blank" rel="noreferrer" key={source.id}>
          <strong>{source.title}</strong>
          <span>{source.extract}</span>
        </a>
      ))}
    </div>
  );
}

function ContextQuestionList({ questions }: { questions: string[] }) {
  if (!questions.length) return <EmptyValue>No context questions generated yet.</EmptyValue>;
  return (
    <div className="context-question-list">
      {questions.map((question) => (
        <span key={question}>{question}</span>
      ))}
    </div>
  );
}

export function ResultPanel({ result }: { result?: ReasoningResult | null }) {
  if (!result) {
    return (
      <section className="workspace-panel result-panel empty-result-panel">
        <Cpu size={30} />
        <h2>Waiting for analysis</h2>
        <p>Upload an image, ask a physical-world question, and the KG pipeline will populate here.</p>
      </section>
    );
  }

  const webContext = result.webContext ?? [];
  const contextQuestions = result.contextQuestions ?? [];

  return (
    <section className="workspace-panel result-panel implementation-output" aria-label="Reasoning result">
      <div className="panel-heading compact">
        <div>
          <span className="eyebrow">
            <ShieldCheck size={16} />
            Live implementation output
          </span>
          <h2>Knowledge-grounded reasoning trace</h2>
        </div>
        <div className="lift-badge">
          <ArrowRight size={15} />
          {result.diagnostics.kgLift >= 0 ? "+" : ""}
          {pct(result.diagnostics.kgLift)} confidence lift
        </div>
      </div>

      <div className="final-answer">
        <span>Final KG-grounded answer</span>
        <strong>{result.augmentedAnswer.answer}</strong>
        <p>{result.augmentedAnswer.reasoning}</p>
      </div>

      <div className="trace-topic">{inferTopic(result)}</div>

      <div className="trace-stats">
        <div>
          <strong>{result.detectedObjects.combined.length}</strong>
          <span>objects</span>
        </div>
        <div>
          <strong>{result.retrievedFacts.length}</strong>
          <span>KG facts</span>
        </div>
        <div>
          <strong>{result.firedRules.length}</strong>
          <span>rules</span>
        </div>
        <div>
          <strong>{webContext.length}</strong>
          <span>web sources</span>
        </div>
      </div>

      <div className="trace-section">
        <h3>
          <Eye size={17} />
          Visual grounding - from image
        </h3>
        <div className="chip-row">
          {result.detectedObjects.fromImage.length ? (
            result.detectedObjects.fromImage.map((object) => (
              <span className="chip" key={object}>
                {object}
              </span>
            ))
          ) : (
            <EmptyValue>No image-specific object terms detected.</EmptyValue>
          )}
        </div>
      </div>

      <div className="trace-section">
        <h3>
          <FileText size={17} />
          PaliGemma image description
        </h3>
        <p className="description-box">{result.imageDescription}</p>
      </div>

      <div className="trace-section">
        <h3>
          <Globe2 size={17} />
          Web-scraped context
        </h3>
        <WebSourceList sources={webContext} />
      </div>

      <div className="trace-section">
        <h3>
          <HelpCircle size={17} />
          Context-related questions
        </h3>
        <ContextQuestionList questions={contextQuestions} />
      </div>

      <div className="trace-section">
        <h3>
          <GitBranch size={17} />
          Objects from question
        </h3>
        <div className="chip-row">
          {result.detectedObjects.fromQuestion.length ? (
            result.detectedObjects.fromQuestion.map((object) => (
              <span className="chip" key={object}>
                {object}
              </span>
            ))
          ) : (
            <EmptyValue>No separate question objects detected.</EmptyValue>
          )}
        </div>
      </div>

      <div className="trace-section">
        <h3>
          <Network size={17} />
          Retrieved knowledge (ConceptNet 5.7)
        </h3>
        <FactList facts={result.retrievedFacts} />
      </div>

      <div className="trace-section">
        <h3>
          <ListChecks size={17} />
          Physics rules
        </h3>
        <RuleList rules={result.firedRules} />
      </div>

      <details className="prompt-details">
        <summary>Show augmented prompt</summary>
        <div className="prompt-grid single">
          <pre>{result.prompts.augmented}</pre>
        </div>
      </details>

      <div className="comparison-heading">
        <h3>Model Answer Comparison</h3>
        <span>+3.3% accuracy with KG</span>
      </div>

      <div className="answer-grid">
        <AnswerCard title="Base model" badge="Without KG" answer={result.baselineAnswer} />
        <AnswerCard title="PaliGemma + ConceptNet" badge="With KG" answer={result.augmentedAnswer} />
      </div>

      <div className="kg-summary">
        <strong>KG injected {result.retrievedFacts.length} physical facts from ConceptNet</strong>
        <span>enabling knowledge-grounded reasoning.</span>
      </div>
    </section>
  );
}
