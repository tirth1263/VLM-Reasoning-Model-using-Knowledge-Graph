import { ArrowRight, CheckCircle2, Cpu, GitBranch, ListChecks, Network, ShieldCheck } from "lucide-react";
import type { ModelAnswer, ReasoningResult } from "../types";

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function AnswerCard({ title, answer }: { title: string; answer: ModelAnswer }) {
  return (
    <article className="answer-card">
      <div className="answer-card-header">
        <span>{title}</span>
        <strong>{pct(answer.confidence)}</strong>
      </div>
      <h3>{answer.answer}</h3>
      <p>{answer.reasoning}</p>
      {answer.evidence.length > 0 && (
        <ul className="evidence-list">
          {answer.evidence.slice(0, 3).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function ResultPanel({ result }: { result?: ReasoningResult | null }) {
  if (!result) {
    return (
      <section className="workspace-panel empty-panel">
        <Cpu size={28} />
        <h2>Awaiting a reasoning run</h2>
        <p>Results will appear as a side-by-side baseline and KG-augmented comparison.</p>
      </section>
    );
  }

  return (
    <section className="workspace-panel result-panel" aria-label="Reasoning result">
      <div className="panel-heading compact">
        <div>
          <span className="eyebrow">
            <ShieldCheck size={16} />
            Model output
          </span>
          <h2>{result.question}</h2>
        </div>
        <div className="lift-badge">
          <ArrowRight size={15} />
          {result.diagnostics.kgLift >= 0 ? "+" : ""}
          {pct(result.diagnostics.kgLift)} confidence lift
        </div>
      </div>

      <div className="answer-grid">
        <AnswerCard title="Baseline VQA prompt" answer={result.baselineAnswer} />
        <AnswerCard title="KG augmented prompt" answer={result.augmentedAnswer} />
      </div>

      <div className="pipeline-grid">
        <article>
          <h3>
            <GitBranch size={17} />
            Grounded objects
          </h3>
          <div className="chip-row">
            {result.detectedObjects.combined.map((object) => (
              <span className="chip" key={object}>
                {object}
              </span>
            ))}
          </div>
          <p className="microcopy">{result.imageDescription}</p>
        </article>

        <article>
          <h3>
            <Network size={17} />
            Retrieved facts
          </h3>
          <div className="fact-list">
            {result.retrievedFacts.map((fact) => (
              <div className="fact-row" key={fact.id}>
                <strong>{fact.subject}</strong>
                <span>{fact.relation}</span>
                <em>{fact.object}</em>
              </div>
            ))}
          </div>
        </article>

        <article>
          <h3>
            <ListChecks size={17} />
            Physics rules
          </h3>
          <div className="rule-list">
            {result.firedRules.length ? (
              result.firedRules.map((rule) => (
                <div className="rule-row" key={rule.id}>
                  <CheckCircle2 size={16} />
                  <span>{rule.statement}</span>
                </div>
              ))
            ) : (
              <p className="microcopy">No hand-written rules fired for this question.</p>
            )}
          </div>
        </article>
      </div>

      <details className="prompt-details">
        <summary>Prompt audit</summary>
        <div className="prompt-grid">
          <pre>{result.prompts.baseline}</pre>
          <pre>{result.prompts.augmented}</pre>
        </div>
      </details>
    </section>
  );
}
