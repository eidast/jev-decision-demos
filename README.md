# Jev Decision Demos

Two local exercises show how to use Jev's structured `choice` answers in different decisions.

| Demo | What it does | Documentation |
| --- | --- | --- |
| [Moral Machine × Jev](MoralMachine/README.md) | Compare a participant's choices in 13 original dilemmas with Jev's A/B probabilities. | [Protocol](MoralMachine/EXPERIMENT.md), [original study background](MoralMachine/ORIGINAL_STUDY.md), [asset credits](MoralMachine/THIRD_PARTY_ASSETS.md) |
| [Tic Tac Toe × Jev](TicTacToe/README.md) | Play as X or O. Rules and minimax restrict candidate squares; Jev chooses the machine's final move. | [Technical design and logs](TicTacToe/TECHNICAL.md) |

## Run on macOS

Install Node.js 20 or newer. Double-click [scripts/start-macos.command](scripts/start-macos.command) in Finder, or run it from Terminal:

```bash
./scripts/start-macos.command
```

The launcher creates a local `.env` file if needed, selects an available port starting at 3000, starts the loopback server, and opens the demo index in your browser. Add `OPENROUTER_API_KEY` or `AI_GATEWAY_API_KEY` to `.env` to use Jev. Restart the launcher after editing the key. The Moral Machine exercise has clearly labeled sample mode without a key; Tic Tac Toe requires a key. Closing the Terminal window or pressing Control-C stops the server.

You can also run `npm start` and open <http://127.0.0.1:3000/>. Set `PORT=3117` before `npm start` if port 3000 is occupied. The routes are `/MoralMachine/` and `/TicTacToe/`.

## Repository layout

- `MoralMachine/` contains its browser files, scenario and report code, documentation, preview images, portrait assets, and ignored local reports.
- `TicTacToe/` contains its browser files, game and decision code, documentation, and ignored local logs.
- `server.js` provides local routes and keeps provider keys on the server.
- `docs/INTEGRATIONS.md` describes the shared Jev and provider contracts.
- `SECURITY.md` describes credential and local data handling.

## Verify

```bash
npm test
npm run check:secrets
npm run analyze:tictactoe
```

Original code and documentation are [MIT licensed](LICENSE). Moral Machine portraits have [separate attribution and license scope](MoralMachine/THIRD_PARTY_ASSETS.md).
