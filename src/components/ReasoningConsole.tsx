import {
  BrainCircuit,
  FileImage,
  FlaskConical,
  ImageIcon,
  ListChecks,
  MessageSquareText,
  Play,
  UploadCloud,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  mode?: "free" | "multiple";
}> = [
  {
    label: "Copper wiring",
    question: "Why is this material used for electrical wiring?",
    choices: [],
    imageDescription: "A close-up of copper wire strands with plastic insulation.",
    mode: "free",
  },
  {
    label: "Rubber vs glass",
    question: "Which of these breaks when dropped?",
    choices: [],
    imageDescription: "A glass ball and a rubber ball are sitting side by side.",
    mode: "free",
  },
  {
    label: "Tree shadow",
    question: "The sun is behind a tree. Where does the tree's shadow fall?",
    choices: [],
    imageDescription: "A tree stands in sunlight with a visible shadow on the ground.",
    mode: "free",
  },
];

type Props = {
  onResult: (result: ReasoningResult, imageFile?: File | null) => Promise<void> | void;
};

export function ReasoningConsole({ onResult }: Props) {
  const [question, setQuestion] = useState(examples[0].question);
  const [choices, setChoices] = useState<Choice[]>(sampleChoices);
  const [imageDescription, setImageDescription] = useState(examples[0].imageDescription);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [answerMode, setAnswerMode] = useState<"free" | "multiple">("free");
  const [useFirebaseAi, setUseFirebaseAi] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const ready = useMemo(
    () => question.trim().length > 5 && (answerMode === "free" || choices.some((choice) => choice.text.trim())),
    [answerMode, choices, question],
  );

  const imagePreviewUrl = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : ""), [imageFile]);

  useEffect(() => {
    if (!imagePreviewUrl) return;
    return () => URL.revokeObjectURL(imagePreviewUrl);
  }, [imagePreviewUrl]);

  function updateChoice(index: number, text: string) {
    setChoices((current) => current.map((choice, itemIndex) => (itemIndex === index ? { ...choice, text } : choice)));
  }

  function updateImage(file: File | null) {
    setImageFile(file);
    if (file && !imageDescription.trim()) {
      setImageDescription(file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]/g, " "));
    }
  }

  async function run() {
    if (!ready) return;
    setRunning(true);
    setError("");
    try {
      const payload: ReasoningInput = {
        question,
        choices: answerMode === "free" ? [] : choices.filter((choice) => choice.text.trim()),
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
              setChoices(example.choices.length ? example.choices : sampleChoices);
              setImageDescription(example.imageDescription);
              setAnswerMode(example.mode ?? "free");
            }}
          >
            <WandSparkles size={15} />
            {example.label}
          </button>
        ))}
      </div>

      <div className="mode-toggle" aria-label="Answer mode">
        <button className={answerMode === "free" ? "active" : ""} type="button" onClick={() => setAnswerMode("free")}>
          <MessageSquareText size={16} />
          Free response
        </button>
        <button className={answerMode === "multiple" ? "active" : ""} type="button" onClick={() => setAnswerMode("multiple")}>
          <ListChecks size={16} />
          Multiple choice
        </button>
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
            onChange={(event) => updateImage(event.target.files?.[0] ?? null)}
          />
          <label
            htmlFor="image-upload"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              updateImage(event.dataTransfer.files?.[0] ?? null);
            }}
          >
            {imagePreviewUrl ? (
              <img className="image-preview" src={imagePreviewUrl} alt={imageFile?.name ?? "Uploaded preview"} />
            ) : (
              <div className="upload-placeholder">
                <ImageIcon size={30} />
                <strong>Drop image or click to upload</strong>
                <span>PNG, JPG, or WebP</span>
              </div>
            )}
            {imagePreviewUrl && (
              <div className="upload-caption">
                <UploadCloud size={15} />
                <span>{imageFile ? `${imageFile.name} - ${Math.round(imageFile.size / 1024)} KB ready for Firebase Storage` : "Image ready"}</span>
              </div>
            )}
          </label>
          {imageFile && (
            <button className="ghost-icon" type="button" onClick={() => updateImage(null)} aria-label="Remove image">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {answerMode === "multiple" && (
        <div className="choices-grid">
          {choices.map((choice, index) => (
            <label className="choice-input" key={choice.id}>
              <span>{choice.id}</span>
              <input value={choice.text} onChange={(event) => updateChoice(index, event.target.value)} />
            </label>
          ))}
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      <div className="action-row">
        <div className="method-note">
          <FileImage size={16} />
          <span>Image cues, ConceptNet-style facts, and physics rules are fused before answer generation.</span>
        </div>
        <button className="primary-button" type="button" disabled={!ready || running} onClick={run}>
          {running ? <FlaskConical size={18} /> : <Play size={18} />}
          <span>{running ? "Reasoning" : "Analyze"}</span>
        </button>
      </div>
    </section>
  );
}
