import { resultFor } from './game.js';

export function scoreLegalMoves(board, machine) {
  const human = machine === 'X' ? 'O' : 'X';
  const cache = new Map();

  function solve(position, turn) {
    const result = resultFor(position);
    if (result) return result.winner === machine ? 1 : result.winner === human ? -1 : 0;
    const key = `${turn}:${position.map((cell) => cell || '-').join('')}`;
    if (cache.has(key)) return cache.get(key);
    const values = position.flatMap((cell, index) => {
      if (cell !== null) return [];
      const next = [...position];
      next[index] = turn;
      return [solve(next, turn === 'X' ? 'O' : 'X')];
    });
    const score = turn === machine ? Math.max(...values) : Math.min(...values);
    cache.set(key, score);
    return score;
  }

  const scores = Object.fromEntries(board.flatMap((cell, index) => {
    if (cell !== null) return [];
    const next = [...board];
    next[index] = machine;
    return [[`cell_${index}`, solve(next, human)]];
  }));
  const bestScore = Math.max(...Object.values(scores));
  const optimalMoves = Object.keys(scores).filter((key) => scores[key] === bestScore);
  const immediateWins = optimalMoves.filter((key) => {
    const next = [...board];
    next[Number(key.slice(5))] = machine;
    return resultFor(next)?.winner === machine;
  });
  return {
    scores,
    bestScore,
    optimalMoves,
    candidateMoves: immediateWins.length ? immediateWins : optimalMoves,
  };
}
