# Tic Tac Toe × Jev

This folder contains the standalone game page, styling, browser code, server-side game logic, and local execution logs. Start the repository server with `npm start` or the macOS launcher `../scripts/start-macos.command` and open `/TicTacToe/` on its local address. A configured OpenRouter or Vercel AI Gateway key is required.

The human selects X or O. X starts, so Jev opens when the human selects O. Players alternate on a 3×3 board; three matching marks in a row wins, and a full board without a winner is a tie. Wins and ties both show a result panel and a Play again action; a tie also gives the full board a distinct visual treatment. Each machine turn sends a `choice` question to Jev with the current board and only the game-theoretically optimal empty squares as options. The server rejects malformed or illegal responses. A provider failure can be retried from the same board. New game returns to mark selection.

The game keeps active state in server memory and saves one ignored local NDJSON log per game in `TicTacToe/logs/`. It does not use Moral Machine cases or artwork. Run `npm run analyze:tictactoe` for policy-separated aggregate log counts. See [TECHNICAL.md](TECHNICAL.md) for the board representation, routes, Jev request, log schema, observed suboptimal decision, and improvement options.
