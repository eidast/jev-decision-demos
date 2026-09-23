# Moral Machine × Jev Decision Lab

An independent, MIT-licensed web demo for exploring 13 hypothetical self-driving car dilemmas. A participant chooses one of two outcomes in each case. Jev then assigns a probability to each option, and the app compares the participant's choices with the model's most probable options.

**The cases are original to this repository.** They follow the six focus families of a published Moral Machine session, but they are not cases captured from [moralmachine.net](https://www.moralmachine.net/) and do not contain Moral Machine vote data. Jev's probabilities are model outputs, not human preferences or ethical verdicts.

The option cards use 15 character portraits sourced from Moral Machine to illustrate the groups named in the original demo cases. The portraits are credited under the project's CC BY 4.0 notice and are separate from the MIT-licensed code. See [THIRD_PARTY_ASSETS.md](THIRD_PARTY_ASSETS.md) for sources, hashes, and the license scope.

## Run locally

Requires Node.js 20 or newer. No package installation is needed.

```bash
cp -n .env.example .env
# Add either OPENROUTER_API_KEY or AI_GATEWAY_API_KEY to .env.
chmod 600 .env
npm start
```

Open <http://127.0.0.1:3000>. If port 3000 is in use, run `PORT=3117 npm start` and open <http://127.0.0.1:3117>. The server binds to `127.0.0.1` by default. Without an API key, the app enters clearly labeled **sample mode**, whose probabilities are illustrative and do not come from Jev.

OpenRouter takes priority when both provider keys are set. The key is read only on the server. Never put it in client code, requests from the browser, documentation, or a commit. See [SECURITY.md](SECURITY.md) for key handling and public deployment requirements.

## What the demo measures

Each scenario shows an A/B choice. The result page reports the two Jev probabilities, the participant's choice, the most probable model choice, the number of matches across 13 cases, and the mean Jev probability assigned to the participant's choices. The participant's choices are sent to the local server for validation and comparison but are **not forwarded to Jev**.

Every completed evaluation now saves a local report in `reports/<run-id>.json`. It includes the timestamp, provider and model, a full snapshot of the scenario wording and both outcomes, your 13 choices, Jev's A/B results, and the session summary. The page lists previous runs, can reopen one, and can download its JSON report. Reports are ignored by Git and stay on this computer unless you explicitly export or share them. The demo currently uses the same 13 authored cases for every run; keeping a snapshot makes future runs comparable even if those cases change. See [the report specification](docs/EXPERIMENT.md#saved-run-reports).

The backend sends 13 `choice` questions in one evaluation request. It uses [OpenRouter's Decisions API](https://openrouter.ai/docs/api/api-reference/alphadecisions/submit-a-decisions-questions-and-answers-request) with `typesafe/jev-1.13`, or [Vercel AI Gateway's evaluation API](https://vercel.com/docs/ai-gateway/modalities/evaluation) with `typesafe-ai/jev`.

## Documentation

| File | Contents |
| --- | --- |
| [docs/EXPERIMENT.md](docs/EXPERIMENT.md) | Research question, exact case inventory, protocol, metrics, interpretation, limitations, and validation evidence. |
| [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md) | Jev concepts, OpenRouter and Vercel request and response contracts, provider selection, and failure behavior. |
| [MoralMachine/README.md](MoralMachine/README.md) | Source-backed account of the original Moral Machine experiment and its scenario space. |
| [SECURITY.md](SECURITY.md) | Credential handling, local network boundary, leak checks, and disclosure process. |
| [AGENTS.md](AGENTS.md) | Repository rules for language, provenance, licensing, and verification. |
| [THIRD_PARTY_ASSETS.md](THIRD_PARTY_ASSETS.md) | Official character portrait provenance, attribution, license scope, and checksums. |

## Verification

```bash
npm test
npm run check:secrets
```

The original code and documentation are licensed under the [MIT License](LICENSE). The copied Moral Machine portraits are credited separately under the project-level CC BY 4.0 notice. This repository's MIT license does not relicense them, Moral Machine's data or marks, or Jev's services.
