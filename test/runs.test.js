import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scenarios } from '../MoralMachine/scenarios.js';
import { getRun, listRuns, saveRun } from '../MoralMachine/runs.js';

test('a saved run keeps scenario snapshots, choices, model results, and summary', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'moral-machine-run-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const directory = join(root, 'reports');
  const inputScenarios = structuredClone(scenarios);
  const choices = inputScenarios.map((scenario) => ({ id: scenario.id, selected: 'a' }));
  const evaluations = scenarios.map((scenario) => ({
    id: scenario.id, choice: 'a', probabilities: { a: 0.7, b: 0.3 },
  }));
  const report = saveRun(directory, {
    provider: 'openrouter', mode: 'jev', model: 'typesafe/jev-1.13',
    scenarios: inputScenarios, choices, evaluations,
  });

  assert.equal(report.summary.agreementCount, 13);
  assert.ok(Math.abs(report.summary.meanSelectedProbability - 0.7) < 1e-12);
  assert.deepEqual(getRun(directory, report.id), report);
  assert.equal(listRuns(directory)[0].id, report.id);
  assert.equal(statSync(join(directory, `${report.id}.json`)).mode & 0o777, 0o600);
  assert.equal(readFileSync(join(directory, `${report.id}.json`), 'utf8').includes('apiKey'), false);
  inputScenarios[0].premise = 'Changed after the run';
  assert.notEqual(getRun(directory, report.id).scenarios[0].premise, inputScenarios[0].premise);
  assert.equal(getRun(directory, '../.env'), null);
  const second = saveRun(directory, {
    provider: 'sample', mode: 'sample', model: null,
    scenarios: inputScenarios, choices, evaluations,
  });
  assert.notEqual(second.id, report.id);
  assert.equal(listRuns(directory).length, 2);
});
