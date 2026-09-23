import { randomUUID } from 'node:crypto';
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chooseJevMove, moveQuestion, resultFor } from './game.js';
import { scoreLegalMoves } from './quality.js';

export class GameError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const decisionPolicy = 'optimal-candidates-jev-choice-v2';

function appendEvent(directory, id, event) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  appendFileSync(join(directory, `${id}.jsonl`), `${JSON.stringify({
    schemaVersion: 2, at: new Date().toISOString(), gameId: id, ...event,
  })}\n`, { encoding: 'utf8', mode: 0o600 });
}

export function publicGame(game) {
  return {
    id: game.id,
    human: game.human,
    board: [...game.board],
    outcome: resultFor(game.board),
    turn: resultFor(game.board) ? null : game.turn,
  };
}

export function createGame(directory, human, provider, model, games) {
  if (!['X', 'O'].includes(human)) throw new GameError('Choose X or O.');
  const game = {
    id: randomUUID(), human, board: Array(9).fill(null),
    turn: human === 'X' ? 'human' : 'jev', pending: false,
  };
  appendEvent(directory, game.id, {
    event: 'game_started', human, machine: human === 'X' ? 'O' : 'X',
    provider, model, decisionPolicy, board: game.board, turn: game.turn,
  });
  games.set(game.id, game);
  return publicGame(game);
}

export function playHuman(directory, game, index) {
  if (!game) throw new GameError('Game not found.', 404);
  if (game.pending || game.turn !== 'human' || resultFor(game.board)) throw new GameError('It is not your turn.', 409);
  if (!Number.isInteger(index) || index < 0 || index > 8 || game.board[index] !== null) throw new GameError('Choose an empty square.', 400);
  const before = [...game.board];
  const after = [...before];
  after[index] = game.human;
  const outcome = resultFor(after);
  appendEvent(directory, game.id, {
    event: 'human_moved', move: index, boardBefore: before, boardAfter: after, outcome,
  });
  game.board = after;
  game.turn = outcome ? null : 'jev';
  return publicGame(game);
}

function failureKind(error) {
  if (error.name === 'TimeoutError') return 'timeout';
  if (error.message === 'Jev did not return a legal move.') return 'invalid_jev_answer';
  if (error.message.startsWith('The provider account')) return 'insufficient_credits';
  if (error.message.startsWith('The API key cannot')) return 'access_denied';
  if (error.message.startsWith('The provider rate limit')) return 'rate_limited';
  if (error.message.startsWith('The provider returned HTTP')) return 'provider_http_error';
  return 'upstream_failure';
}

export async function playMachine(directory, game, providerOptions) {
  if (!game) throw new GameError('Game not found.', 404);
  if (game.pending || game.turn !== 'jev' || resultFor(game.board)) throw new GameError('It is not Jev’s turn.', 409);
  game.pending = true;
  const before = [...game.board];
  const machine = game.human === 'X' ? 'O' : 'X';
  const quality = scoreLegalMoves(before, machine);
  const request = moveQuestion(before, game.human, quality.candidateMoves);
  const started = performance.now();
  try {
    const answer = await chooseJevMove(before, game.human, {
      ...providerOptions, allowedMoves: quality.candidateMoves,
    });
    const key = `cell_${answer.move}`;
    appendEvent(directory, game.id, {
      event: 'jev_moved', provider: providerOptions.provider, model: providerOptions.model,
      decisionPolicy,
      durationMs: Math.round(performance.now() - started), boardBefore: before,
      request, choice: key, probabilities: answer.probabilities,
      boardAfter: answer.board, outcome: answer.outcome,
      analysis: {
        scores: quality.scores,
        bestScore: quality.bestScore,
        optimalMoves: quality.optimalMoves,
        candidateMoves: quality.candidateMoves,
        chosenScore: quality.scores[key],
        suboptimal: quality.scores[key] < quality.bestScore,
      },
    });
    game.board = answer.board;
    game.turn = answer.outcome ? null : 'human';
    return publicGame(game);
  } catch (error) {
    appendEvent(directory, game.id, {
      event: 'jev_failed', provider: providerOptions.provider, model: providerOptions.model,
      decisionPolicy,
      durationMs: Math.round(performance.now() - started), boardBefore: before,
      request, errorKind: failureKind(error),
    });
    throw error;
  } finally {
    game.pending = false;
  }
}
