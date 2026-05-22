import { BarChart3, Download, FlaskConical, Save } from "lucide-react";
import { reportReferenceMetrics } from "../data/knowledgeBase";
import { runEvaluation } from "../model/evaluator";
import type { EvaluationRun } from "../types";

type Props = {
  run?: EvaluationRun | null;
  onRun: (run: EvaluationRun) => void;
  onSave?: (run: EvaluationRun) => void;
};

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function EvaluationLab({ run, onRun, onSave }: Props) {
  function start() {
    onRun(runEvaluation());
  }

  return (
    <section className="workspace-panel evaluation-panel" aria-label="Evaluation lab">
      <div className="panel-heading compact">
        <div>
          <span className="eyebrow">
            <BarChart3 size={16} />
            Ablation Lab
          </span>
          <h2>Measure whether knowledge quality improves answers</h2>
        </div>
        <div className="button-row">
          {run && onSave && (
            <button className="soft-button" type="button" onClick={() => onSave(run)}>
              <Save size={15} />
              Save run
            </button>
          )}
          <button className="primary-button small" type="button" onClick={start}>
            <FlaskConical size={16} />
            Run evaluation
          </button>
        </div>
      </div>

      <div className="metric-table">
        <div className="metric-row heading">
          <span>Report condition</span>
          <span>Accuracy</span>
          <span>Correct</span>
          <span>Delta</span>
        </div>
        {reportReferenceMetrics.map((metric) => (
          <div className="metric-row" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.accuracy}</strong>
            <span>{metric.correct}</span>
            <span>{metric.delta}</span>
          </div>
        ))}
      </div>

      {run ? (
        <>
          <div className="metric-table live">
            <div className="metric-row heading">
              <span>App benchmark condition</span>
              <span>Accuracy</span>
              <span>Correct</span>
              <span>Delta</span>
            </div>
            {run.rows.map((row) => (
              <div className="metric-row" key={row.condition}>
                <span>{row.label}</span>
                <strong>{pct(row.accuracy)}</strong>
                <span>
                  {row.correct}/{row.total}
                </span>
                <span>
                  {row.delta >= 0 ? "+" : ""}
                  {pct(row.delta)}
                </span>
              </div>
            ))}
          </div>

          <details className="case-details">
            <summary>
              <Download size={15} />
              Case-level predictions
            </summary>
            <div className="case-grid">
              {run.cases.map((item) => (
                <div className="case-row" key={item.id}>
                  <span>{item.category}</span>
                  <strong>{item.expected}</strong>
                  <span>B:{item.predictions.baseline}</span>
                  <span>R:{item.predictions.randomKg}</span>
                  <span>K:{item.predictions.kgOnly}</span>
                  <span>F:{item.predictions.fullSystem}</span>
                </div>
              ))}
            </div>
          </details>
        </>
      ) : (
        <p className="microcopy">The evaluator follows the report: baseline, random KG control, KG-only, and full KG + rules.</p>
      )}
    </section>
  );
}
