export const winningLines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function resultFor(board) {
  const line = winningLines.find(([a, b, c]) => board[a] && board[a] === board[b] && board[b] === board[c]);
  if (line) return { winner: board[line[0]], line };
  return board.every(Boolean) ? { winner: null, line: null } : null;
}

export function validMachineTurn(board, human) {
  if (!Array.isArray(board) || board.length !== 9 || !['X', 'O'].includes(human) ||
      board.some((cell) => cell !== null && cell !== 'X' && cell !== 'O') || resultFor(board)) return false;
  const x = board.filter((cell) => cell === 'X').length;
  const o = board.filter((cell) => cell === 'O').length;
  return human === 'O' ? x === o : x === o + 1;
}

export function moveQuestion(board, human, allowedMoves) {
  const machine = human === 'X' ? 'O' : 'X';
  const criteria = Object.fromEntries(board.flatMap((cell, index) => cell === null
    && (!allowedMoves || allowedMoves.includes(`cell_${index}`))
    ? [[`cell_${index}`, `Place ${machine} in row ${Math.floor(index / 3) + 1}, column ${index % 3 + 1}.`]] : []));
  return {
    state: {
      game: 'Tic-tac-toe on a 3 by 3 board. X moves first. Three in a row wins.',
      board: [0, 3, 6].map((start) => board.slice(start, start + 3).map((cell) => cell || 'empty')),
      machine,
      human,
      next_turn: machine,
    },
    questions: {
      move: {
        type: 'choice',
        instructions: `You are playing ${machine} against a human playing ${human}. Choose exactly one legal move. Prefer an immediate win; otherwise block an immediate human win; otherwise choose a move that improves your chance of winning or drawing.`,
        criteria,
      },
    },
  };
}

export function applyMachineAnswer(board, human, answer, allowedMoves) {
  if (!validMachineTurn(board, human)) throw new Error('Invalid game state.');
  const key = answer?.choice;
  const match = typeof key === 'string' && /^cell_[0-8]$/.exec(key);
  const index = match ? Number(key.slice(5)) : -1;
  const legalKeys = board.flatMap((cell, cellIndex) => cell === null &&
    (!allowedMoves || allowedMoves.includes(`cell_${cellIndex}`)) ? [`cell_${cellIndex}`] : []);
  const probabilities = Object.fromEntries(legalKeys.map((legalKey) => {
    const value = answer?.probabilities?.[legalKey];
    return [legalKey, typeof value === 'number' ? value : NaN];
  }));
  const total = Object.values(probabilities).reduce((sum, value) => sum + value, 0);
  if (index < 0 || board[index] !== null || !legalKeys.includes(key) ||
      Object.values(probabilities).some((value) => !Number.isFinite(value) || value < 0 || value > 1) ||
      Math.abs(total - 1) > 0.06) {
    throw new Error('Jev did not return a legal move.');
  }
  const next = [...board];
  next[index] = human === 'X' ? 'O' : 'X';
  return { board: next, move: index, outcome: resultFor(next), probabilities };
}

export async function chooseJevMove(board, human, { provider, model, key, allowedMoves, fetchImpl = fetch }) {
  if (!validMachineTurn(board, human)) throw new Error('Invalid game state.');
  if (!key) throw new Error('Configure a Jev API key to play.');
  const url = provider === 'openrouter'
    ? 'https://openrouter.ai/api/alpha/decisions'
    : 'https://ai-gateway.vercel.sh/v1/evaluate';
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, ...moveQuestion(board, human, allowedMoves) }),
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) {
    if (response.status === 402) throw new Error('The provider account has insufficient credits.');
    if (response.status === 401 || response.status === 403) throw new Error('The API key cannot access Jev on this provider.');
    if (response.status === 429) throw new Error('The provider rate limit was reached. Please retry.');
    throw new Error(`The provider returned HTTP ${response.status}.`);
  }
  const payload = await response.json();
  return applyMachineAnswer(board, human, payload?.answers?.move, allowedMoves);
}
