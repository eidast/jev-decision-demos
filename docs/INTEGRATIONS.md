# Jev integration contract

**Reviewed:** September 22, 2026. This file documents the APIs used or supported by the demo. Provider versions, prices, and beta contracts can change; recheck the linked primary documentation when upgrading.

## What Jev does

Jev is TypeSafe AI's first *System One* model. It evaluates a supplied text-based state against bounded questions and returns typed answers. Its primitives are `choice` (one named option with probabilities per option), `score` (a position on an ordered scale), and `noul` (a probability from 0 to 1 that a proposition is true). Vercel AI SDK calls the last type `boolean`. Questions in one request share the state and are evaluated independently. Jev does not generate prose, source code, or an explanation of its reasoning. It currently accepts text, including strings and text in JSON objects or arrays, rather than direct image, audio, or video input. [TypeSafe System One](https://docs.typesafe.ai/concepts/system-one), [TypeSafe primitives](https://docs.typesafe.ai/primitives).

Its probabilities are intended to be calibrated across groups of predictions. A value such as 0.8 does not guarantee an individual answer is correct. Application code decides what to do with the response. [TypeSafe System One](https://docs.typesafe.ai/concepts/system-one).

## Provider routes

| Route | Model ID | Endpoint | Key |
| --- | --- | --- | --- |
| OpenRouter, used for the live demo | `typesafe/jev-1.13` | `POST https://openrouter.ai/api/alpha/decisions` | `OPENROUTER_API_KEY` |
| Vercel AI Gateway, implemented but not live-tested here | `typesafe-ai/jev` | `POST https://ai-gateway.vercel.sh/v1/evaluate` | `AI_GATEWAY_API_KEY` |

The server selects OpenRouter when both keys are present. It falls back to Vercel if only its key is present, and to clearly labeled sample mode if neither exists. Both providers receive only the built-in scenario descriptions and questions. The participant's selections remain in the local app and its server request; they are not included in the request to Jev.
The local scenario objects also contain character portrait IDs for display and saved-run snapshots. `scenarioState` removes that visual metadata before a provider request, so the model evaluates the same textual outcome descriptions.

### OpenRouter

The OpenRouter route uses its **Decisions API**, not `/api/v1/chat/completions`. A simplified one-case request is:

```json
{
  "model": "typesafe/jev-1.13",
  "state": {
    "id": "gender-1",
    "context": "The vehicle cannot stop before the crossing.",
    "option_a": { "action": "Stay on course", "spared": "3 adult men", "harmed": "3 adult women" },
    "option_b": { "action": "Swerve", "spared": "3 adult women", "harmed": "3 adult men" }
  },
  "questions": {
    "gender-1": {
      "type": "choice",
      "instructions": "Evaluate only scenario gender-1. Which outcome would you choose? Answer A or B.",
      "criteria": { "a": "Option A ...", "b": "Option B ..." }
    }
  }
}
```

In the real application, `state` is an array containing **all 13 cases**, and `questions` contains one `choice` question per case ID. The response has an `answers` map plus model and usage information. Each choice answer contains `choice` and `probabilities`; OpenRouter's raw answer may also contain `confidence`. The server validates every answer and returns only case ID, chosen option, and A/B probabilities to the browser. It does not expose billing details, provider metadata, or credentials. [OpenRouter Decisions reference](https://openrouter.ai/docs/api/api-reference/alphadecisions/submit-a-decisions-questions-and-answers-request).

OpenRouter also publishes a `~typesafe/jev-latest` alias. This repo pins `typesafe/jev-1.13` so a provider update does not silently change the demo's model family. The published listing showed a 32,000-token context window and USD 0.042 per million input tokens on the review date. Check the [current model page](https://openrouter.ai/typesafe/jev-1.13/) before budgeting.

### Vercel AI Gateway

The backend's alternate route uses Vercel's HTTP evaluation API with the same top-level `model`, `state`, and `questions` concept. Its `choice` response likewise exposes a chosen option and probability per option. Vercel's `boolean` corresponds to TypeSafe's `noul`; this demo only sends `choice` questions. [Vercel evaluation documentation](https://vercel.com/docs/ai-gateway/modalities/evaluation).

For a TypeScript app using Vercel AI SDK 7, the documented equivalent is:

```ts
import { experimental_evaluate as evaluate } from 'ai';

const result = await evaluate({
  model: 'typesafe-ai/jev',
  state: { message: 'I was charged twice.' },
  questions: {
    route: {
      type: 'choice',
      instructions: 'Which team should own this request?',
      criteria: { billing: 'Payments', support: 'Technical problems' },
    },
  },
});

console.log(result.answers.route.choice);
```

This repo uses the built-in Node.js `fetch` API to avoid a package dependency. AI SDK's evaluation API is experimental; Vercel documents AI SDK 7.0.105 or later for this capability. [Vercel announcement](https://vercel.com/changelog/typesafe-ai-jev-now-available-on-ai-gateway), [evaluation documentation](https://vercel.com/docs/ai-gateway/modalities/evaluation).

## Response validation and failures

`server.js` requires 13 answer IDs, each with a choice of `a` or `b`, finite A/B probabilities between 0 and 1, and a probability sum within 0.06 of 1 to allow provider rounding. An incomplete or malformed provider response fails the whole session instead of mixing live and sample results. The outbound call times out after 45 seconds. The browser receives a short error for insufficient credits, denied access, rate limiting, or another provider status; arbitrary upstream response bodies are not returned.

The `POST /api/evaluate` route validates an exact, ordered list of 13 participant choices against the server's case IDs. It accepts JSON only and limits the request body to 24,000 characters. The participant's selections affect the comparison metrics, not Jev's input.

After validation, the server writes a local run report and returns that report to the browser. This adds the participant's choices and scenario snapshot to the local response while keeping the raw provider payload and credentials out of it. `GET /api/runs` returns report summaries, and `GET /api/runs/:id` returns one full saved report; see [the report specification](EXPERIMENT.md#saved-run-reports).

## Evaluation still needed for any real use

The demo checks that Jev responds and that its values are displayed correctly. It does **not** establish moral validity, calibration on these dilemmas, stability across repeated calls, sensitivity to wording, or demographic fairness. A real decision workflow would need labeled examples, repeated measurements, defined error costs, thresholds chosen from those examples, and an explicit human or deterministic fallback. OpenRouter notes that there is no universal confidence threshold. [OpenRouter Jev guide](https://openrouter.ai/blog/tutorials/jev-vs-llm-when-to-use-each/).
