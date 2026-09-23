# Repository rules

These rules apply to every change in this repository.

## Language and documentation

- Write source code, identifiers, comments, UI text, tests, and documentation in English.
- Keep `README.md`, `docs/EXPERIMENT.md`, `docs/INTEGRATIONS.md`, `SECURITY.md`, and `MoralMachine/README.md` aligned with the behavior that is actually implemented. Document changes to the saved run schema and retention behavior in `docs/EXPERIMENT.md`.
- Preserve the distinction between original demo cases, the published Moral Machine experiment, and Jev model outputs. Never describe demo cases as official cases or model probabilities as human vote shares.
- Record material changes to the 13-case protocol, model question wording, provider IDs, or reported metrics in `docs/EXPERIMENT.md` before calling a change complete.

## License and attribution

- The original code and documentation in this repository are MIT licensed; keep `LICENSE` and the `license` field in `package.json`.
- Do not copy Moral Machine artwork, scenario data, or third-party code into this project without checking their separate rights and recording provenance.

## Secrets and verification

- Never commit, paste into documentation, log, or send API keys to the browser. Keep local credentials only in ignored `.env` files or environment variables.
- Keep saved run reports local and ignored by Git. Do not include API keys or raw provider metadata in a report, and preserve the exact scenario snapshot so historical reports remain interpretable.
- Run `npm run check:secrets` before staging or publishing changes. Verify that `.env` is ignored and has restrictive local permissions.
- Keep the development server bound to loopback by default. Any public deployment needs a separate authenticated backend and rate limits before using a paid key.
- Verify the 13-case flow in the browser and the live provider response after changes to the UI or evaluation path. A sample-mode run alone does not verify Jev.
