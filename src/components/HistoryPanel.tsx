import { Clock3, RefreshCcw } from "lucide-react";
import type { ReasoningResult } from "../types";

type Props = {
  sessions: ReasoningResult[];
  onRefresh: () => void;
  onSelect: (session: ReasoningResult) => void;
};

export function HistoryPanel({ sessions, onRefresh, onSelect }: Props) {
  return (
    <section className="workspace-panel history-panel" aria-label="Saved runs">
      <div className="panel-heading compact">
        <div>
          <span className="eyebrow">
            <Clock3 size={16} />
            Firebase history
          </span>
          <h2>Saved reasoning sessions</h2>
        </div>
        <button className="soft-button icon-only" type="button" onClick={onRefresh} aria-label="Refresh history">
          <RefreshCcw size={16} />
        </button>
      </div>
      <div className="history-list">
        {sessions.length ? (
          sessions.map((session) => (
            <button type="button" key={session.id} onClick={() => onSelect(session)}>
              <strong>{session.augmentedAnswer?.answer ?? "Reasoning run"}</strong>
              <span>{session.question}</span>
            </button>
          ))
        ) : (
          <p className="microcopy">Sign in and run the model to persist sessions in Firestore and images in Storage.</p>
        )}
      </div>
    </section>
  );
}
