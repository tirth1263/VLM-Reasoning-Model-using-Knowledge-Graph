import { useCallback, useEffect, useState } from "react";
import { AuthPanel } from "./components/AuthPanel";
import { EvaluationLab } from "./components/EvaluationLab";
import { HistoryPanel } from "./components/HistoryPanel";
import { KnowledgeExplorer } from "./components/KnowledgeExplorer";
import { ReasoningConsole } from "./components/ReasoningConsole";
import { ResultPanel } from "./components/ResultPanel";
import { useAuth } from "./hooks/useAuth";
import { loadRecentSessions, saveEvaluationRun, saveReasoningSession } from "./services/sessionStore";
import type { EvaluationRun, ReasoningResult } from "./types";
import "./App.css";

function App() {
  const { user, loading, signIn, signOut } = useAuth();
  const [result, setResult] = useState<ReasoningResult | null>(null);
  const [sessions, setSessions] = useState<ReasoningResult[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluationRun | null>(null);
  const [notice, setNotice] = useState("");

  const refreshHistory = useCallback(async () => {
    if (!user) {
      setSessions([]);
      return;
    }
    const recent = await loadRecentSessions(user);
    setSessions(recent);
  }, [user]);

  useEffect(() => {
    // Firestore history is external state; refresh when auth changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshHistory();
  }, [refreshHistory]);

  async function handleResult(nextResult: ReasoningResult, imageFile?: File | null) {
    setResult(nextResult);
    if (!user) {
      setNotice("Run completed locally. Sign in with Google to save it to Firebase.");
      return;
    }
    await saveReasoningSession(user, nextResult, imageFile);
    setNotice("Reasoning session saved to Firebase.");
    await refreshHistory();
  }

  async function handleEvaluationSave(run: EvaluationRun) {
    if (!user) {
      setNotice("Sign in with Google before saving evaluation runs.");
      return;
    }
    await saveEvaluationRun(user, run);
    setNotice("Evaluation run saved to Firestore.");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">
          <span>V</span>
          <div>
            <strong>VLM Reasoning Model</strong>
            <small>Knowledge Graph + Physical Rules</small>
          </div>
        </div>
        <AuthPanel user={user} loading={loading} onSignIn={signIn} onSignOut={signOut} />
      </header>

      {notice && (
        <button className="notice" type="button" onClick={() => setNotice("")}>
          {notice}
        </button>
      )}

      <div className="main-grid">
        <div className="primary-stack">
          <ReasoningConsole onResult={handleResult} />
          <ResultPanel result={result} />
          <EvaluationLab run={evaluation} onRun={setEvaluation} onSave={handleEvaluationSave} />
        </div>
        <aside className="side-stack">
          <HistoryPanel sessions={sessions} onRefresh={refreshHistory} onSelect={setResult} />
          <KnowledgeExplorer />
        </aside>
      </div>
    </main>
  );
}

export default App;
