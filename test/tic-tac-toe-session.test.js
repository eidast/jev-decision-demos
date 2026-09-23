import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGame, playHuman, playMachine } from '../TicTacToe/session.js';
import { scoreLegalMoves } from '../TicTacToe/quality.js';

test('the minimax audit identifies a winning move', () => {
  const board = ['O', 'O', null, 'X', 'X', null, 'X', null, null];
  const audit = scoreLegalMoves(board, 'O');
  assert.equal(audit.bestScore, 1);
  assert.equal(audit.scores.cell_2, 1);
  assert.ok(audit.optimalMoves.includes('cell_2'));
  assert.deepEqual(audit.candidateMoves, ['cell_2']);
});

test('the observed avoidable loss is excluded from Jev candidates', () => {
  const board = ['O', null, null, null, 'X', null, null, null, 'X'];
  const audit = scoreLegalMoves(board, 'O');
  assert.equal(audit.scores.cell_5, -1);
  assert.deepEqual(audit.candidateMoves, ['cell_2', 'cell_6']);
  assert.equal(audit.bestScore, 0);
});

test('a complete local decision trace records sanitized Jev input and tactical quality', async (t) => {
  const parent = mkdtempSync(join(tmpdir(), 'jev-game-test-'));
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  const directory = join(parent, 'logs');
  const games = new Map();
  const started = createGame(directory, 'X', 'openrouter', 'test-model', games);
  assert.equal(started.turn, 'human');
  const game = games.get(started.id);
  playHuman(directory, game, 4);
  const moved = await playMachine(directory, game, {
    provider: 'openrouter', model: 'test-model', key: 'test-only-placeholder',
    fetchImpl: async () => ({ ok: true, json: async () => ({ answers: { move: {
      choice: 'cell_0', probabilities: { cell_0: 1, cell_2: 0, cell_6: 0, cell_8: 0 },
    } } }) }),
  });
  assert.equal(moved.board[0], 'O');
  assert.equal(moved.turn, 'human');
  const afterHuman = playHuman(directory, game, 8);
  assert.equal(afterHuman.board[8], 'X');
  const file = join(directory, `${started.id}.jsonl`);
  const events = readFileSync(file, 'utf8').trim().split('\n').map(JSON.parse);
  assert.deepEqual(events.map((event) => event.event), ['game_started', 'human_moved', 'jev_moved', 'human_moved']);
  assert.equal(events[2].choice, 'cell_0');
  assert.equal(events[2].analysis.suboptimal, false);
  assert.equal(events[2].schemaVersion, 2);
  assert.equal(events[2].decisionPolicy, 'optimal-candidates-jev-choice-v2');
  assert.deepEqual(Object.keys(events[2].request.questions.move.criteria), ['cell_0', 'cell_2', 'cell_6', 'cell_8']);
  assert.equal(events[2].request.state.board[0][1], 'empty');
  assert.equal(readFileSync(file, 'utf8').includes('test-only-placeholder'), false);
  assert.equal(statSync(directory).mode & 0o777, 0o700);
  assert.equal(statSync(file).mode & 0o777, 0o600);
});

test('a provider failure is logged and leaves the board ready for retry', async (t) => {
  const parent = mkdtempSync(join(tmpdir(), 'jev-game-failure-'));
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  const directory = join(parent, 'logs');
  const games = new Map();
  const started = createGame(directory, 'O', 'openrouter', 'test-model', games);
  const game = games.get(started.id);
  await assert.rejects(playMachine(directory, game, {
    provider: 'openrouter', model: 'test-model', key: 'test-only-placeholder',
    fetchImpl: async () => ({ ok: false, status: 429 }),
  }), /rate limit/);
  assert.deepEqual(game.board, Array(9).fill(null));
  assert.equal(game.turn, 'jev');
  assert.equal(game.pending, false);
  const events = readFileSync(join(directory, `${started.id}.jsonl`), 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(events.at(-1).event, 'jev_failed');
  assert.equal(events.at(-1).errorKind, 'rate_limited');
});
