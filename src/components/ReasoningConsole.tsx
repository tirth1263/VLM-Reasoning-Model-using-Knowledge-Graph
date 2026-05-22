import { BrainCircuit, FileImage, FlaskConical, Play, UploadCloud, WandSparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Choice, ReasoningInput, ReasoningResult } from "../types";
import { runReasoning } from "../model/localReasoner";

const sampleChoices: Choice[] = [
  { id: "A", text: "It conducts electricity well" },
  { id: "B", text: "It is transparent" },
  { id: "C", text: "It floats on water" },
  { id: "D", text: "It shatters because it is glass" },
];

const examples: Array<{
  label: string;
  question: string;
  choices: Choice[];
  imageDescription: string;
}> = [
  {
    label: "Copper wiring",
    question: "Why is copper often used inside electrical wiring?",
    choices: sampleChoices,
    imageDescription: "A cut electrical wire exposes copper strands inside plastic insulation.",
  },
  {
    label: "Rubber vs glass",
    question: "A rubber ball and a glass ball are dropped. What is most likely?",
    choices: [
      { id: "A", text: "Rubber bounces and glass can shatter" },
      { id: "B", text: "Glass bounces higher than rubber" },
      { id: "C", text: "Both become gases" },
      { id: "D", text: "Copper conducts electricity" },
    ],
    imageDescription: "A rubber ball and a glass ball are next to each other above a hard floor.",
  },
  {
    label: "Tree shadow",
    question: "The sun is behind a tree. Where does the tree's shadow fall?",
    choices: [
      { id: "A", text: "Toward the sun" },
      { id: "B", text: "Opposite the sun" },
      { id: "C", text: "Inside the tree" },
      { id: "D", text: "Only above the tree" },
    ],
    imageDescription: "A tree stands in sunlight with a visible shadow on the ground.",
  },
];

type Props = {
  onResult: (result: ReasoningResult, imageFile?: File | null) => Promise<void> | void;
};

export function ReasoningConsole({ onResult }: Props) {
  const [question, setQuestion] = useState(examples[0].question);
  const [choices, setChoices] = useState<Choice[]>(examples[0].choices);
  const [imageDescription, setImageDescription] = useState(examples[0].imageDescription);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [useFirebaseAi, setUseFirebaseAi] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const ready = useMemo(() => question.trim().length > 5 && choices.some((choice) => choice.text.trim()), [choices, question]);

  function updateChoice(index: number, text: string) {
    setChoices((current) => current.map((choice, itemIndex) => (itemIndex === index ? { ...choice, text } : choice)));
  }

  async function run() {
    if (!ready) return;
    setRunning(true);
    setError("");
    try {
      const payload: ReasoningInput = {
        question,
        choices: choices.filter((choice) => choice.text.trim()),
        imageFile,
        imageDescription,
        useFirebaseAi,
      };
      const result = await runReasoning(payload);
      await onResult(result, imageFile);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="workspace-panel console-panel" aria-label="Reasoning console">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">
            <BrainCircuit size={16} />
            KG-VLM Reasoning Console
          </span>
          <h1>Physical reasoning with grounded knowledge</h1>
        </div>
        <label className="switch">
          <input type="checkbox" checked={useFirebaseAi} onChange={(event) => setUseFirebaseAi(event.target.checked)} />
          <span>Firebase AI VLM</span>
        </label>
      </div>

      <div className="console-stats" aria-label="Research metrics">
        <div>
          <strong>112,905</strong>
          <span>KG facts</span>
        </div>
        <div>
          <strong>16</strong>
          <span>physics rules</span>
        </div>
        <div>
          <strong>+3.3</strong>
          <span>accuracy points</span>
        </div>
        <div className="signal-visual" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <div className="example-row" aria-label="Example prompts">
        {examples.map((example) => (
          <button
            className="soft-button"
            type="button"
            key={example.label}
            onClick={() => {
              setQuestion(example.question);
              setChoices(example.choices);
              setImageDescription(example.imageDescription);
            }}
          >
            <WandSparkles size={15} />
            {example.label}
          </button>
        ))}
      </div>

      <div className="console-grid">
        <div className="input-stack">
          <label className="field-label" htmlFor="question">
            Question
          </label>
          <textarea id="question" value={question} onChange={(event) => setQuestion(event.target.value)} rows={5} />

          <label className="field-label" htmlFor="scene">
            Scene notes
          </label>
          <textarea id="scene" value={imageDescription} onChange={(event) => setImageDescription(event.target.value)} rows={3} />
        </div>

        <div className="upload-box">
          <input
            id="image-upload"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
          />
          <label htmlFor="image-upload">
            <UploadCloud size={28} />
            <strong>{imageFile ? imageFile.name : "Upload image"}</strong>
            <span>{imageFile ? `${Math.round(imageFile.size / 1024)} KB ready for Storage` : "PNG, JPG, or WebP"}</span>
          </label>
          {imageFile && (
            <button className="ghost-icon" type="button" onClick={() => setImageFile(null)} aria-label="Remove image">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="choices-grid">
        {choices.map((choice, index) => (
          <label className="choice-input" key={choice.id}>
            <span>{choice.id}</span>
            <input value={choice.text} onChange={(event) => updateChoice(index, event.target.value)} />
          </label>
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="action-row">
        <div className="method-note">
          <FileImage size={16} />
          <span>Image cues, ConceptNet-style facts, and physics rules are fused before answer generation.</span>
        </div>
        <button className="primary-button" type="button" disabled={!ready || running} onClick={run}>
          {running ? <FlaskConical size={18} /> : <Play size={18} />}
          <span>{running ? "Reasoning" : "Run model"}</span>
        </button>
      </div>
    </section>
  );
}
