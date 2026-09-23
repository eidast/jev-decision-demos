# Tic Tac Toe technical design and decision audit

## Scope and ownership

This is a local, single-player, 3×3 Tic Tac Toe game. The human chooses X or O; X always moves first. Jev makes every machine move. The deterministic game code validates turns, occupied squares, wins, and draws. A minimax solver scores all legal moves before the Jev call and limits its candidate set to moves with the best game-theoretic result. Jev chooses the final square among those candidates. The solver also records an audit of the choice. There is no sample opponent, gameplay database, or persistence of an unfinished game across a server restart.

| Part | Responsibility |
| --- | --- |
| `index.html`, `style.css` | Welcome, mark selection, board, status, retry, and local log location. |
| `app.js` | Renders server state and posts human or Jev turns; disables input while a request is pending. |
| `game.js` | Eight winning lines, result detection, Jev question construction, provider call, and response validation. |
| `session.js` | In-memory games, authoritative turn and board updates, one NDJSON log per game. |
| `quality.js` | Exhaustive minimax scores for all legal machine moves; defines the optimal candidate set and audit. |
| `../server.js` | Loopback HTTP routes, provider selection, static allowlist, and secret-bearing server calls. |

## Board representation

The canonical board is an array of nine values: `null`, `"X"`, or `"O"`. The index is `row * 3 + column`, with zero-based rows and columns:

```text
0 | 1 | 2
--+---+--
3 | 4 | 5
--+---+--
6 | 7 | 8
```

For example, `["O", null, null, null, "X", "O", null, null, "X"]` is:

```text
O | · | ·
· | X | O
· | · | X
```

`resultFor` checks rows `[0,1,2]`, `[3,4,5]`, `[6,7,8]`; columns `[0,3,6]`, `[1,4,7]`, `[2,5,8]`; and diagonals `[0,4,8]`, `[2,4,6]`. Three equal nonempty marks return the winner and the winning line. A full board without a line returns a draw (`winner: null`). Otherwise the result is `null`.

The server keeps each active game in a `Map` keyed by a random UUID. It alone applies human and machine moves. It checks the current turn and that the requested human index is an empty integer from 0 through 8. Completed games reject further moves. The client receives a copy of the board, current turn, and result after every accepted move. Refreshing the page starts a new UI session; the prior in-memory game is not resumed.

## HTTP journey

All routes are local to the same loopback server. Requests and responses are JSON.

1. `GET /api/tic-tac-toe/status` reports the selected provider and whether a key is configured. It does not verify provider access.
2. `POST /api/tic-tac-toe/games` with `{ "human": "X" }` or `{ "human": "O" }` creates a game and its log. The response includes `{ id, human, board, outcome, turn }`. `turn` is `"human"` for X and `"jev"` for O.
3. `POST /api/tic-tac-toe/games/:id/human` with `{ "index": 4 }` applies a legal human mark. If the game continues, the turn becomes `"jev"`.
4. `POST /api/tic-tac-toe/games/:id/jev` with `{}` asks Jev to choose a move. If the answer is valid, the server applies it and returns the new game state. A provider failure leaves the board unchanged and allows retry.
5. A win or draw sets `turn: null`; the browser disables the board and shows a result panel with a Play again action. A win highlights the winning line. A tie changes the board outline and cell surfaces, announces the tie in text, and offers the same replay action. New game returns to mark selection.

`GET /api/tic-tac-toe/games/:id` returns the current server state. If a move response is lost after the server applied it, the browser reads this route before retrying. In particular, it avoids blindly paying for a second Jev request when the first move already completed.

The server accepts only JSON requests, limits bodies to 24,000 characters, and serves only allowlisted files. The development host defaults to `127.0.0.1`.

## Jev integration

The server chooses OpenRouter (`typesafe/jev-1.13`, `POST /api/alpha/decisions`) if `OPENROUTER_API_KEY` is configured; otherwise it uses Vercel AI Gateway (`typesafe-ai/jev`, `POST /v1/evaluate`) if `AI_GATEWAY_API_KEY` is configured. OpenRouter takes priority when both exist. Without a key, the game cannot start. Keys stay in the server environment or ignored `.env` and are sent only as HTTPS Bearer headers.

For one machine turn, `moveQuestion` converts the flat array to a three-row text matrix. Each `null` becomes `"empty"`; X and O remain as marks. It includes the machine mark, human mark, and next turn. It creates one `choice` question named `move`. Its criteria are the **minimax-optimal empty squares only**, keyed `cell_0` through `cell_8`; each criterion names a one-based row and column. If any candidate wins immediately, the criteria contain only those immediate wins. The instructions tell Jev to choose a legal move, prefer an immediate win, block an immediate human win, then improve its chance of winning or drawing.

```json
{
  "model": "typesafe/jev-1.13",
  "state": {
    "game": "Tic-tac-toe on a 3 by 3 board. X moves first. Three in a row wins.",
    "board": [["O", "empty", "empty"], ["empty", "X", "empty"], ["empty", "empty", "X"]],
    "machine": "O", "human": "X", "next_turn": "O"
  },
  "questions": {
    "move": {
      "type": "choice",
      "instructions": "You are playing O against a human playing X. Choose exactly one legal move. ...",
      "criteria": { "cell_2": "Place O in row 1, column 3.", "cell_6": "Place O in row 3, column 1." }
    }
  }
}
```

This example uses the previously observed board: the solver offers cells 2 and 6 because either can preserve a draw against perfect play. The provider returns `answers.move.choice` and probabilities keyed by each offered candidate. The server requires a selected key from the candidate set, finite probabilities in `[0,1]` for every offered key, and a total within `0.06` of one to tolerate rounding. It rejects an invalid answer rather than choosing a substitute. The browser receives only the updated game state; raw provider metadata and probabilities stay out of the browser. Calls time out after 45 seconds. See the [OpenRouter Decisions API](https://openrouter.ai/docs/api/api-reference/alphadecisions/submit-a-decisions-questions-and-answers-request) and [TypeSafe primitives](https://docs.typesafe.ai/primitives).

The probabilities describe Jev's distribution over the offered square labels. They are not calculated win rates or a guarantee of optimal play. This implementation uses the provider's `choice` field; it does not sample from or re-rank the returned probabilities.

## Local execution logs

Each game writes `TicTacToe/logs/<game-id>.jsonl`. The directory is created with mode `0700`, files with mode `0600`, and Git ignores the entire log directory. Each line is one JSON event with `schemaVersion: 2`, UTC `at`, and `gameId`. Older v1 logs remain valid historical evidence of the unrestricted policy; the analyzer reports the two policies separately.

| Event | Recorded fields |
| --- | --- |
| `game_started` | Marks, provider/model ID, decision policy, empty board, first turn. |
| `human_moved` | Chosen index, board before and after, resulting win/draw or `null`. |
| `jev_moved` | Provider/model ID, decision policy, duration, board before/after, exact bounded state/question sent, selected candidate key, sanitized probabilities, outcome, and minimax analysis. |
| `jev_failed` | Provider/model ID, duration, board and question, controlled error category; no raw upstream body. |

Logs contain no API key, Authorization header, raw provider metadata, billing fields, or Moral Machine reports. They do contain the local player's chosen squares. There is **no automatic deletion**: logs remain until the owner removes them. An unfinished game can leave a partial log; a server restart loses its in-memory state but preserves its log. `npm run analyze:tictactoe` prints aggregate counts of games, finished games, Jev moves, suboptimal moves, and failed calls. These counts are diagnostic, not an estimate of general model quality unless games are collected under a controlled protocol.

## How the quality audit works

`scoreLegalMoves` evaluates every legal Jev square using minimax. A terminal Jev win is `+1`, draw `0`, and human win `-1`. At subsequent Jev turns it maximizes this score; at human turns it assumes the human minimizes it. Memoization avoids solving the same board repeatedly. The server sends Jev only the best-scoring squares (`candidateMoves`), further narrowed to immediate wins when available. The log records each legal square's score, the best score, all best-scoring squares, the offered candidates, the score of Jev's actual choice, and `suboptimal`. Under the v2 policy, a valid Jev choice cannot be suboptimal by this measure. This is a perfect-play comparison, not a prediction of what a particular human will do. Equal scores do not rank speed of victory or style.

### Controlled observation

In one local OpenRouter run on September 22, 2026, the board was `O·· / ·X· / ··X`, with Jev playing O. The audit gave squares 2 and 6 a score of `0` (draw with perfect follow-up), while square 5 scored `-1` (forced loss). Jev chose square 5; its returned probability for that square was `0.33`. The human then won on the `[2,4,6]` diagonal. This is one observed game, not a measured failure rate or proof of why the model chose that square. The ignored local log retains the full trace.

## Decision policy and remaining limits

The v1 policy offered every empty cell and asked Jev to choose. The controlled observation above showed an avoidable loss. The v2 `optimal-candidates-jev-choice-v2` policy computes the best minimax score before calling Jev. It offers only moves with that score, and prioritizes an immediate win if one exists. Jev still makes the final `choice`; there is no deterministic substitute when the provider fails. A forced loss remains possible if the position was already lost, and a human can choose non-optimal moves. This change guarantees only that an accepted machine move does not worsen the perfect-play outcome from the current position.

The policy has a different decision meaning from v1: Jev expresses a preference among prefiltered moves, not over every empty cell. Its returned probabilities apply only to the offered set. Compare v1 and v2 logs separately; do not interpret v2's zero suboptimal count as evidence that Jev learned optimal play.

Further work could measure latency, cost, and stability on a fixed set of reachable boards, including repeated calls for positions with multiple optimal moves. Prompt variations can be tested against that benchmark, but a prompt alone cannot enforce game rules. A deterministic minimax opponent would remove Jev's final square selection and is outside this demo's current purpose.
