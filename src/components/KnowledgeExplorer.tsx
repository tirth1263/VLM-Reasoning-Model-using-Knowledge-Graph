import { Search, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import { conceptNetSeedFacts, physicsRules } from "../data/knowledgeBase";
import { normalizeText } from "../model/text";

export function KnowledgeExplorer() {
  const [query, setQuery] = useState("copper");

  const facts = useMemo(() => {
    const normalized = normalizeText(query);
    return conceptNetSeedFacts
      .filter((fact) => normalizeText(`${fact.subject} ${fact.relation} ${fact.object} ${fact.tags.join(" ")}`).includes(normalized))
      .slice(0, 12);
  }, [query]);

  const rules = useMemo(() => {
    const normalized = normalizeText(query);
    return physicsRules.filter((rule) => normalizeText(`${rule.statement} ${rule.triggerTerms.join(" ")}`).includes(normalized)).slice(0, 6);
  }, [query]);

  return (
    <section className="workspace-panel knowledge-panel" aria-label="Knowledge explorer">
      <div className="panel-heading compact">
        <div>
          <span className="eyebrow">
            <Share2 size={16} />
            Knowledge Graph
          </span>
          <h2>Inspect facts and rules before they reach the prompt</h2>
        </div>
        <label className="search-box">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search object or property" />
        </label>
      </div>

      <div className="knowledge-grid">
        <div>
          <h3>ConceptNet-style facts</h3>
          <div className="fact-list tall">
            {facts.map((fact) => (
              <div className="fact-row" key={fact.id}>
                <strong>{fact.subject}</strong>
                <span>{fact.relation}</span>
                <em>{fact.object}</em>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3>Hand-written physics rules</h3>
          <div className="rule-list tall">
            {rules.map((rule) => (
              <div className="rule-row expanded" key={rule.id}>
                <span>{rule.statement}</span>
                <small>{rule.explanation}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
