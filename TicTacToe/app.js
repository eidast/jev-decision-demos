const $ = (selector) => document.querySelector(selector);
const boardElement = $('#board');
let game = null;
let waiting = false;
let failed = false;
let requestVersion = 0;

async function postJson(path, data) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'The game request failed.');
  return payload;
}

async function getGame(id) {
  const response = await fetch(`/api/tic-tac-toe/games/${id}`);
  if (!response.ok) throw new Error('The game state could not be recovered.');
  return response.json();
}

function showError(message) {
  $('#error').textContent = message;
  $('#error').classList.remove('hidden');
}

function render() {
  if (!game) return;
  const { board, human, outcome, turn } = game;
  const machine = human === 'X' ? 'O' : 'X';
  const result = outcome ? outcome.winner === human ? 'human-win' : outcome.winner === machine ? 'jev-win' : 'tie' : null;
  boardElement.classList.toggle('tie', result === 'tie');
  boardElement.classList.toggle('jev-win', result === 'jev-win');
  boardElement.setAttribute('aria-label', result === 'tie' ? 'Tic tac toe board, tie game' : 'Tic tac toe board');
  boardElement.replaceChildren(...board.map((mark, index) => {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = `cell${mark === 'O' ? ' o' : ''}${outcome?.line?.includes(index) ? ' winning' : ''}`;
    cell.setAttribute('aria-label', `Row ${Math.floor(index / 3) + 1}, column ${index % 3 + 1}: ${mark || 'empty'}`);
    cell.textContent = mark || '';
    cell.disabled = Boolean(mark || outcome || waiting || failed || turn !== 'human');
    cell.addEventListener('click', () => play(index));
    return cell;
  }));
  $('#status').textContent = outcome ? ''
    : failed ? 'Jev’s move did not complete.' : waiting ? 'Saving or choosing a move…'
      : turn === 'jev' ? 'Jev’s turn.' : 'Your turn.';
  const resultPanel = $('#resultPanel');
  resultPanel.className = `result-panel${result ? ` ${result}` : ' hidden'}`;
  if (result) {
    const content = result === 'human-win'
      ? { symbol: '✓', kicker: 'GAME OVER', title: 'You win.', description: 'Three in a row. Well played.' }
      : result === 'jev-win'
        ? { symbol: '✓', kicker: 'GAME OVER', title: 'Jev wins.', description: 'Jev made three in a row.' }
        : { symbol: '=', kicker: 'GAME OVER', title: 'It’s a tie.', description: 'All nine squares are filled. Neither player made three in a row.' };
    $('#gameTitle').textContent = content.title;
    $('#resultSymbol').textContent = content.symbol;
    $('#resultKicker').textContent = content.kicker;
    $('#resultTitle').textContent = content.title;
    $('#resultDescription').textContent = content.description;
  }
  if (!result) $('#gameTitle').textContent = 'Make your move.';
  $('#retry').classList.toggle('hidden', !failed);
}

async function machineTurn() {
  if (!game || game.turn !== 'jev' || waiting) return;
  waiting = true;
  failed = false;
  $('#error').classList.add('hidden');
  render();
  const version = ++requestVersion;
  try {
    const next = await postJson(`/api/tic-tac-toe/games/${game.id}/jev`, {});
    if (version !== requestVersion) return;
    game = next;
  } catch (error) {
    if (version !== requestVersion) return;
    try {
      const current = await getGame(game.id);
      if (version !== requestVersion) return;
      if (current.turn !== 'jev') { game = current; return; }
    } catch { /* Keep the original request error for retry. */ }
    failed = true;
    showError(error.message);
  } finally {
    if (version === requestVersion) { waiting = false; render(); }
  }
}

async function play(index) {
  if (!game || waiting || failed || game.turn !== 'human' || game.board[index] || game.outcome) return;
  waiting = true;
  $('#error').classList.add('hidden');
  render();
  const version = ++requestVersion;
  try {
    const next = await postJson(`/api/tic-tac-toe/games/${game.id}/human`, { index });
    if (version !== requestVersion) return;
    game = next;
    waiting = false;
    render();
    if (game.turn === 'jev') machineTurn();
  } catch (error) {
    if (version !== requestVersion) return;
    try {
      const current = await getGame(game.id);
      if (version !== requestVersion) return;
      if (current.board[index] === game.human) {
        game = current;
        waiting = false;
        render();
        if (game.turn === 'jev') machineTurn();
        return;
      }
    } catch { /* Keep the original request error. */ }
    waiting = false;
    showError(error.message);
    render();
  }
}

async function start(mark) {
  if (waiting) return;
  waiting = true;
  document.querySelectorAll('[data-mark]').forEach((button) => { button.disabled = true; });
  const version = ++requestVersion;
  try {
    const next = await postJson('/api/tic-tac-toe/games', { human: mark });
    if (version !== requestVersion) return;
    game = next;
    waiting = false;
    failed = false;
    $('#error').classList.add('hidden');
    $('#humanMark').textContent = mark;
    $('#jevMark').textContent = mark === 'X' ? 'O' : 'X';
    $('#logPath').textContent = `TicTacToe/logs/${game.id}.jsonl`;
    $('#welcome').classList.add('hidden');
    $('#game').classList.remove('hidden');
    render();
    if (game.turn === 'jev') machineTurn();
  } catch (error) {
    if (version !== requestVersion) return;
    waiting = false;
    $('#connection').textContent = error.message;
    $('#connection').classList.add('error-text');
    document.querySelectorAll('[data-mark]').forEach((button) => { button.disabled = false; });
  }
}

document.querySelectorAll('[data-mark]').forEach((button) => button.addEventListener('click', () => start(button.dataset.mark)));
$('#retry').addEventListener('click', machineTurn);
function resetGame() {
  requestVersion++;
  game = null;
  waiting = false;
  failed = false;
  $('#game').classList.add('hidden');
  $('#welcome').classList.remove('hidden');
  document.querySelectorAll('[data-mark]').forEach((button) => { button.disabled = false; });
  $('#welcome').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
$('#newGame').addEventListener('click', resetGame);
$('#playAgain').addEventListener('click', resetGame);

try {
  const response = await fetch('/api/tic-tac-toe/status');
  if (!response.ok) throw new Error('The game server is unavailable.');
  const { provider, ready } = await response.json();
  $('#connection').textContent = ready
    ? `Jev configured via ${provider === 'openrouter' ? 'OpenRouter' : 'Vercel AI Gateway'}. Choose your mark to begin.`
    : 'Add an OpenRouter or Vercel AI Gateway key to the local .env file, then restart the server.';
  $('#connection').classList.toggle('error-text', !ready);
  document.querySelectorAll('[data-mark]').forEach((button) => { button.disabled = !ready; });
} catch (error) {
  $('#connection').textContent = error.message;
  $('#connection').classList.add('error-text');
}
