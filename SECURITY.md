# Security and credential handling

This demo uses a paid Jev provider from a local Node.js server. Treat an OpenRouter or Vercel API key as a secret even when it was issued only for a short test.

## Current boundary

- `server.js` reads `OPENROUTER_API_KEY` or `AI_GATEWAY_API_KEY` from the process environment or the local `.env` file. It sends the key only as a Bearer token to the selected provider over HTTPS.
- The HTTP server binds to `127.0.0.1` by default. Do not change `HOST` to a public address while relying on this unauthenticated evaluation endpoint.
- The browser receives scenario descriptions, a provider label, and reduced probability results. It never receives the key, raw provider metadata, or provider response bodies.
- The participant's A/B selections are validated by the local server but are not forwarded to Jev. The built-in hypothetical cases are sent to the provider.
- No application database or browser storage is used. Completed runs are saved as local JSON files in the Git-ignored `reports/` directory with mode `0600`; these files contain participant decisions and scenario snapshots but no key. The provider may retain requests according to its own terms; consult the provider before using private data.

## Local key setup

```bash
cp -n .env.example .env
# Edit .env locally and set one provider key.
chmod 600 .env
npm run check:secrets
```

`.gitignore` excludes `.env` and other `.env*` files except `.env.example`, as well as local `reports/`. The current local `.env` is intentionally **not** part of the MIT-licensed project. Do not add it with `git add -f`, attach it to a task, paste its value into an issue, or place it in a client-side environment variable. Review downloaded reports before sharing them. Use a test key with a spending limit where the provider supports one. Revoke or rotate the temporary demo key after the demo.

## Leak defenses

1. `npm run check:secrets` scans repository-visible files for common key and private-key patterns, fails if Git tracks an `.env` secret file, and verifies that `.env` is ignored.
2. `.githooks/pre-commit` runs the scan before local commits. Enable it in this checkout with `git config core.hooksPath .githooks`.
3. `.github/workflows/check.yml` runs the scan and tests on push and pull request when this repository is hosted on GitHub.
4. The server serves only an explicit static file allowlist; it cannot serve `.env` through a URL. Error responses use controlled messages rather than raw provider bodies.

Pattern scanning is a backstop, not a guarantee. Review diffs before publication, and verify the destination repository has no staged secret with `git status --short --ignored` and `git ls-files .env`. A clean public scan does not prove that a key was never exposed elsewhere.

## Public deployment

The current endpoint would let any caller who reaches it spend the server's provider credits. Before deploying it beyond loopback, add authentication, request rate limits, spending limits, server-side monitoring, and an explicit privacy policy for data sent to the provider. Keep provider keys in the deployment platform's secret store. Do not ship the local `.env` file.

## If a key leaks

Revoke it at the provider first, then issue a replacement. Remove the key from files, commits, logs, screenshots, and artifacts where possible. A key removed from the latest commit may still exist in Git history; treat it as compromised and rotate it regardless of cleanup. Report a suspected leak privately to the repository owner rather than opening a public issue containing the credential.
