import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scenarios, scenarioState, validateChoices } from './MoralMachine/scenarios.js';
import { getRun, listRuns, saveRun } from './MoralMachine/runs.js';
import { createGame, GameError, playHuman, playMachine, publicGame } from './TicTacToe/session.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const reportsDirectory = join(root, 'MoralMachine', 'reports');
const gameLogsDirectory = join(root, 'TicTacToe', 'logs');
const games = new Map();
if (existsSync(join(root, '.env'))) process.loadEnvFile(join(root, '.env'));

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
const openRouterKey = process.env.OPENROUTER_API_KEY;
const gatewayKey = process.env.AI_GATEWAY_API_KEY;
const provider = openRouterKey ? 'openrouter' : gatewayKey ? 'vercel' : 'sample';
const model = provider === 'openrouter' ? 'typesafe/jev-1.13' : provider === 'vercel' ? 'typesafe-ai/jev' : null;

const sampleProbabilities = [
  0.49, 0.51, 0.24, 0.27, 0.5, 0.51, 0.49,
  0.5, 0.18, 0.78, 0.08, 0.86, 0.31,
];

function makeQuestions() {
  return Object.fromEntries(scenarios.map((scenario) => [
    scenario.id,
    {
      type: 'choice',
      instructions: `Evaluate only scenario "${scenario.id}". Given the unavoidable crash, which of the two outcomes would you choose? Answer A or B.`,
      criteria: {
        a: `Option A: ${scenario.a.action}; ${scenario.a.spared} are spared; ${scenario.a.harmed} are killed.`,
        b: `Option B: ${scenario.b.action}; ${scenario.b.spared} are spared; ${scenario.b.harmed} are killed.`,
      },
    },
  ]));
}

function normalizeAnswers(payload) {
  const answers = payload?.answers;
  if (!answers || typeof answers !== 'object') throw new Error('The provider returned no answers.');
  return scenarios.map((scenario) => {
    const answer = answers[scenario.id];
    const a = Number(answer?.probabilities?.a);
    const b = Number(answer?.probabilities?.b);
    if (!['a', 'b'].includes(answer?.choice) || !Number.isFinite(a) || !Number.isFinite(b) ||
        a < 0 || a > 1 || b < 0 || b > 1 || Math.abs(a + b - 1) > 0.06) {
      throw new Error(`Invalid provider answer for ${scenario.id}.`);
    }
    return { id: scenario.id, choice: answer.choice, probabilities: { a, b } };
  });
}

async function callJev() {
  const isOpenRouter = provider === 'openrouter';
  const url = isOpenRouter
    ? 'https://openrouter.ai/api/alpha/decisions'
    : 'https://ai-gateway.vercel.sh/v1/evaluate';
  const key = isOpenRouter ? openRouterKey : gatewayKey;
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      state: scenarios.map((s) => ({ id: s.id, ...scenarioState(s) })),
      questions: makeQuestions(),
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) {
    if (response.status === 402) throw new Error('The provider account has insufficient credits.');
    if (response.status === 401 || response.status === 403) throw new Error('The API key cannot access Jev on this provider.');
    if (response.status === 429) throw new Error('The provider rate limit was reached. Please retry.');
    throw new Error(`The provider returned HTTP ${response.status}.`);
  }
  return normalizeAnswers(await response.json());
}

function sampleAnswers() {
  return scenarios.map((scenario, index) => {
    const a = sampleProbabilities[index];
    return { id: scenario.id, choice: a >= 0.5 ? 'a' : 'b', probabilities: { a, b: 1 - a } };
  });
}

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store' });
  res.end(body);
}

async function readJson(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 24_000) throw new Error('Request body is too large.');
  }
  return JSON.parse(body);
}

const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (req.method === 'GET' && url.pathname === '/api/scenarios') {
      return json(res, 200, { scenarios, provider });
    }
    if (req.method === 'GET' && url.pathname === '/api/tic-tac-toe/status') {
      return json(res, 200, { provider, ready: provider !== 'sample' });
    }
    const gameStateMatch = url.pathname.match(/^\/api\/tic-tac-toe\/games\/([0-9a-f-]{36})$/);
    if (req.method === 'GET' && gameStateMatch) {
      const game = games.get(gameStateMatch[1]);
      return game ? json(res, 200, publicGame(game)) : json(res, 404, { error: 'Game not found.' });
    }
    if (req.method === 'POST' && url.pathname.startsWith('/api/tic-tac-toe/games')) {
      if (!req.headers['content-type']?.startsWith('application/json')) return json(res, 415, { error: 'Expected application/json.' });
      let input;
      try { input = await readJson(req); }
      catch (error) { return json(res, 400, { error: error.message === 'Request body is too large.' ? error.message : 'Invalid JSON request.' }); }
      if (provider === 'sample') return json(res, 503, { error: 'Configure a Jev API key to play.' });
      try {
        if (url.pathname === '/api/tic-tac-toe/games') {
          return json(res, 201, createGame(gameLogsDirectory, input?.human, provider, model, games));
        }
        const match = url.pathname.match(/^\/api\/tic-tac-toe\/games\/([0-9a-f-]{36})\/(human|jev)$/);
        if (!match) return json(res, 404, { error: 'Game route not found.' });
        const game = games.get(match[1]);
        const state = match[2] === 'human'
          ? playHuman(gameLogsDirectory, game, input?.index)
          : await playMachine(gameLogsDirectory, game, {
            provider, model, key: provider === 'openrouter' ? openRouterKey : gatewayKey,
          });
        return json(res, 200, state);
      } catch (error) {
        if (error instanceof GameError) return json(res, error.status, { error: error.message });
        throw error;
      }
    }
    if (req.method === 'GET' && url.pathname === '/api/runs') {
      return json(res, 200, { runs: listRuns(reportsDirectory) });
    }
    if (req.method === 'GET' && url.pathname.startsWith('/api/runs/')) {
      const report = getRun(reportsDirectory, url.pathname.slice('/api/runs/'.length));
      return report ? json(res, 200, report) : json(res, 404, { error: 'Run not found.' });
    }
    if (req.method === 'POST' && url.pathname === '/api/evaluate') {
      if (!req.headers['content-type']?.startsWith('application/json')) return json(res, 415, { error: 'Expected application/json.' });
      let input;
      try { input = await readJson(req); }
      catch (error) { return json(res, 400, { error: error.message === 'Request body is too large.' ? error.message : 'Invalid JSON request.' }); }
      if (!validateChoices(input?.choices)) return json(res, 400, { error: 'Exactly 13 valid decisions are required, in order.' });
      const evaluations = provider === 'sample' ? sampleAnswers() : await callJev();
      const report = saveRun(reportsDirectory, {
        provider, mode: provider === 'sample' ? 'sample' : 'jev', model,
        scenarios, choices: input.choices, evaluations,
      });
      return json(res, 200, report);
    }
    if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed.' });
    if (url.pathname === '/MoralMachine') {
      res.writeHead(308, { Location: '/MoralMachine/' });
      return res.end();
    }
    const assetMatch = url.pathname.match(/^\/MoralMachine\/assets\/moral-machine\/([a-z]+_passenger\.svg)$/);
    if (assetMatch) {
      const file = join(root, 'MoralMachine', 'public', 'assets', 'moral-machine', assetMatch[1]);
      if (!existsSync(file)) return json(res, 404, { error: 'Not found.' });
      const contents = readFileSync(file);
      res.writeHead(200, { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Content-Length': contents.length, 'Cache-Control': 'public, max-age=3600' });
      return res.end(contents);
    }
    const path = normalize(url.pathname);
    const gameFile = { '/TicTacToe': 'index.html', '/TicTacToe/': 'index.html',
      '/TicTacToe/index.html': 'index.html', '/TicTacToe/app.js': 'app.js', '/TicTacToe/style.css': 'style.css' }[path];
    const moralFile = { '/MoralMachine': 'index.html', '/MoralMachine/': 'index.html',
      '/MoralMachine/index.html': 'index.html', '/MoralMachine/assets.html': 'assets.html',
      '/MoralMachine/app.js': 'app.js', '/MoralMachine/style.css': 'style.css' }[path];
    const landingFile = path === '/' || path === '/index.html';
    if (!gameFile && !moralFile && !landingFile) return json(res, 404, { error: 'Not found.' });
    const file = gameFile ? join(root, 'TicTacToe', gameFile)
      : moralFile ? join(root, 'MoralMachine', 'public', moralFile)
      : join(root, 'site', 'index.html');
    const contents = readFileSync(file);
    res.writeHead(200, { 'Content-Type': `${mime[extname(file)]}; charset=utf-8`, 'Content-Length': contents.length });
    res.end(contents);
  } catch (error) {
    console.error('Request failed:', error.name || 'Error');
    const safe = error.message === 'Jev did not return a legal move.' || error.message.startsWith('The provider account') ||
      error.message.startsWith('The API key cannot') || error.message.startsWith('The provider rate limit') ||
      error.message.startsWith('The provider returned HTTP');
    json(res, 502, { error: safe ? error.message : 'The request could not be completed. Check the server configuration and retry.' });
  }
});

server.listen(port, host, () => console.log(`Jev demos: http://${host}:${port} (${provider})`));
