# VLM Reasoning Model using Knowledge Graph

Firebase web app for improving physical-world VLM reasoning with Knowledge Graph augmentation. The implementation follows the CSE 579 report pipeline:

1. Ground physical objects from an image description, uploaded image filename, and question text.
2. Retrieve relevant ConceptNet-style physical facts.
3. Filter facts by semantic and lexical relevance to the question.
4. Fire hand-written physical rules for shadows, buoyancy, elasticity, gravity, heat, reflection, magnetism, and insulation.
5. Build baseline and KG-augmented prompts.
6. Compare baseline answers against KG-augmented answers.
7. Run the same ablation conditions used in the report: baseline, random KG, KG-only, and KG + rules.

## App Features

- Google sign in through Firebase Authentication.
- Firestore persistence for reasoning sessions and evaluation runs.
- Firebase Storage upload path for reasoning images.
- Optional Firebase AI Logic multimodal grounding and answer generation.
- Local KG-symbolic fallback that works without a paid model endpoint.
- Evaluation lab with report reference metrics and a runnable mini ScienceQA-style physics benchmark.
- Knowledge explorer for inspecting retrieved facts and physics rules.

## Local Development

```bash
npm install
npm run dev
```

Open the local Vite URL printed in the terminal.

## Firebase

The project is configured for Firebase project `vlm-reasoning-model`.

```bash
npm run build
firebase deploy
```

Rules are included in:

- `firestore.rules`
- `storage.rules`

The client Firebase config is stored in `src/lib/firebase.ts`. Firebase Web API keys are public app identifiers; access control is enforced by Authentication, Firestore rules, Storage rules, and App Check when enabled.

## Firebase AI Logic

The app includes an optional `Firebase AI VLM` toggle. It uses the Firebase AI Logic Web SDK and defaults to:

```bash
VITE_FIREBASE_AI_MODEL=gemini-2.5-flash
```

Create a `.env.local` from `.env.example` if you want to change the model name.

If Firebase AI Logic is not enabled or the model call fails, the app continues with the local KG-symbolic reasoner.

## Research Notes

The original report found that zero-shot KG augmentation worked better than LoRA fine-tuning for this task:

- Baseline PaliGemma-3B: 28.1% on 121 ScienceQA physics validation questions.
- ConceptNet KG only: 30.6%.
- KG + hand-written physics rules: 31.4%.
- Random KG hurt accuracy, showing that knowledge quality mattered.
- LoRA fine-tuning collapsed into template memorization and was not used as the production path.

This app packages that winning inference-time augmentation approach into a polished Firebase demo.
