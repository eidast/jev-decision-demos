import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const runIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function saveRun(directory, { provider, mode, model, scenarios, choices, evaluations }) {
  const report = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    provider,
    mode,
    model,
    scenarios: structuredClone(scenarios),
    choices: structuredClone(choices),
    evaluations: structuredClone(evaluations),
    summary: {
      agreementCount: evaluations.filter((answer, index) => answer.choice === choices[index].selected).length,
      meanSelectedProbability: evaluations.reduce((sum, answer, index) =>
        sum + answer.probabilities[choices[index].selected], 0) / evaluations.length,
      scenarioCount: scenarios.length,
    },
  };
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  writeFileSync(join(directory, `${report.id}.json`), `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  return report;
}

export function getRun(directory, id) {
  if (!runIdPattern.test(id)) return null;
  try {
    return JSON.parse(readFileSync(join(directory, `${id}.json`), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

export function listRuns(directory) {
  let files;
  try {
    files = readdirSync(directory).filter((name) => runIdPattern.test(name.replace(/\.json$/, '')) && name.endsWith('.json'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  return files.map((name) => {
    const { id, createdAt, provider, mode, model, summary } = JSON.parse(readFileSync(join(directory, name), 'utf8'));
    return { id, createdAt, provider, mode, model, summary };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
