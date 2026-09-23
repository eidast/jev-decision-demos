import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scenarios, scenarioState, validateChoices } from './scenarios.js';

const root = fileURLToPath(new URL('.', import.meta.url));
if (existsSync(join(root, '.env'))) process.loadEnvFile(join(root, '.env'));

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
const openRouterKey = process.env.OPENROUTER_API_KEY;
const gatewayKey = process.env.AI_GATEWAY_API_KEY;
const provider = openRouterKey ? 'openrouter' : gatewayKey ? 'vercel' : 'sample';

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
  const model = isOpenRouter ? 'typesafe/jev-1.13' : 'typesafe-ai/jev';
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
    if (req.method === 'POST' && url.pathname === '/api/evaluate') {
      if (!req.headers['content-type']?.startsWith('application/json')) return json(res, 415, { error: 'Expected application/json.' });
      let input;
      try { input = await readJson(req); }
      catch (error) { return json(res, 400, { error: error.message === 'Request body is too large.' ? error.message : 'Invalid JSON request.' }); }
      if (!validateChoices(input?.choices)) return json(res, 400, { error: 'Exactly 13 valid decisions are required, in order.' });
      const evaluations = provider === 'sample' ? sampleAnswers() : await callJev();
      return json(res, 200, {
        provider,
        mode: provider === 'sample' ? 'sample' : 'jev',
        evaluations,
      });
    }
    if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed.' });
    const path = normalize(url.pathname === '/' ? '/index.html' : url.pathname);
    if (!['/index.html', '/style.css', '/app.js'].includes(path)) return json(res, 404, { error: 'Not found.' });
    const file = join(root, 'public', path.slice(1));
    const contents = readFileSync(file);
    res.writeHead(200, { 'Content-Type': `${mime[extname(file)]}; charset=utf-8`, 'Content-Length': contents.length });
    res.end(contents);
  } catch (error) {
    console.error('Evaluation failed:', error.name || 'Error');
    const safe = error.message.startsWith('The provider account') ||
      error.message.startsWith('The API key cannot') || error.message.startsWith('The provider rate limit') ||
      error.message.startsWith('The provider returned HTTP');
    json(res, 502, { error: safe ? error.message : 'The evaluation could not be completed. Check the server configuration and retry.' });
  }
});

server.listen(port, host, () => console.log(`Moral Machine × Jev: http://${host}:${port} (${provider})`));
