import test from 'node:test';
import assert from 'node:assert/strict';
import { applyMachineAnswer, chooseJevMove, moveQuestion, resultFor, validMachineTurn } from '../TicTacToe/game.js';

test('X starts, only legal machine turns are accepted, and completed boards stop', () => {
  assert.equal(validMachineTurn(Array(9).fill(null), 'O'), true);
  assert.equal(validMachineTurn(Array(9).fill(null), 'X'), false);
  assert.equal(validMachineTurn(['X', null, null, null, null, null, null, null, null], 'X'), true);
  assert.equal(validMachineTurn(['X', 'X', 'X', 'O', 'O', null, null, null, null], 'O'), false);
  assert.equal(validMachineTurn(['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'], 'O'), false);
  assert.deepEqual(resultFor(['X', 'X', 'X', null, null, null, null, null, null]), { winner: 'X', line: [0, 1, 2] });
  assert.deepEqual(resultFor(['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X']), { winner: null, line: null });
});

test('Jev receives only empty squares and cannot select an occupied square', () => {
  const board = ['X', null, null, null, null, null, null, null, null];
  const { state, questions } = moveQuestion(board, 'X');
  assert.deepEqual(state.board[0], ['X', 'empty', 'empty']);
  assert.equal(Object.keys(questions.move.criteria).length, 8);
  assert.equal(Object.hasOwn(questions.move.criteria, 'cell_0'), false);
  assert.throws(() => applyMachineAnswer(board, 'X', { choice: 'cell_0', probabilities: { cell_0: 1 } }), /legal move/);
  const probabilities = Object.fromEntries(Array.from({ length: 8 }, (_, offset) => [`cell_${offset + 1}`, offset === 3 ? 1 : 0]));
  assert.deepEqual(applyMachineAnswer(board, 'X', { choice: 'cell_4', probabilities }), {
    board: ['X', null, null, null, 'O', null, null, null, null], move: 4, outcome: null, probabilities,
  });
});

test('a filtered Jev question accepts only minimax-approved squares', () => {
  const board = [null, null, null, null, 'X', null, null, null, null];
  const allowed = ['cell_0', 'cell_2', 'cell_6', 'cell_8'];
  assert.deepEqual(Object.keys(moveQuestion(board, 'X', allowed).questions.move.criteria), allowed);
  assert.throws(() => applyMachineAnswer(board, 'X', {
    choice: 'cell_1', probabilities: { cell_0: 0, cell_2: 0, cell_6: 0, cell_8: 0, cell_1: 1 },
  }, allowed), /legal move/);
  assert.equal(applyMachineAnswer(board, 'X', {
    choice: 'cell_2', probabilities: { cell_0: 0, cell_2: 1, cell_6: 0, cell_8: 0 },
  }, allowed).move, 2);
});

test('the selected move comes from Jev response and the request keeps the key server side', async () => {
  let request;
  const answer = await chooseJevMove(Array(9).fill(null), 'O', {
    provider: 'openrouter', model: 'typesafe/jev-1.13', key: 'test-only-placeholder',
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ answers: { move: { choice: 'cell_4', probabilities: {
        ...Object.fromEntries(Array.from({ length: 9 }, (_, index) => [`cell_${index}`, index === 0 ? 0.69 : 0])), cell_4: 0.31,
      } } } }) };
    },
  });
  assert.equal(answer.move, 4);
  assert.equal(answer.board[4], 'X');
  assert.equal(request.url, 'https://openrouter.ai/api/alpha/decisions');
  assert.equal(request.options.headers.Authorization, 'Bearer test-only-placeholder');
  assert.equal(JSON.parse(request.options.body).questions.move.type, 'choice');
  assert.equal(request.options.body.includes('test-only-placeholder'), false);
});
