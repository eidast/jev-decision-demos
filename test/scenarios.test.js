import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { scenarios, scenarioState, validateChoices } from '../MoralMachine/scenarios.js';

test('a session has the documented six pairs and one mixed case', () => {
  assert.equal(scenarios.length, 13);
  const counts = Object.groupBy(scenarios, (scenario) => scenario.family);
  for (const family of ['Gender', 'Age', 'Physical fitness', 'Social status', 'Species', 'Number of characters']) {
    assert.equal(counts[family]?.length, 2, family);
  }
  assert.equal(counts['Mixed case']?.length, 1);
  assert.equal(new Set(scenarios.map((scenario) => scenario.id)).size, 13);
});

test('each pair of outcomes reverses who is spared and killed', () => {
  for (const scenario of scenarios) {
    assert.equal(scenario.a.spared, scenario.b.harmed, scenario.id);
    assert.equal(scenario.a.harmed, scenario.b.spared, scenario.id);
    assert.notEqual(scenario.a.action, scenario.b.action, scenario.id);
  }
});

test('each pictured group matches the scenario count and uses an available portrait', () => {
  for (const scenario of scenarios) {
    for (const outcome of [scenario.a, scenario.b]) {
      for (const kind of ['spared', 'harmed']) {
        assert.equal(outcome.visuals[kind].length, Number(outcome[kind].split(' ')[0]), scenario.id);
        for (const icon of outcome.visuals[kind]) {
          assert.ok(existsSync(new URL(`../MoralMachine/public/assets/moral-machine/${icon}_passenger.svg`, import.meta.url)), icon);
        }
      }
    }
    assert.equal(JSON.stringify(scenarioState(scenario)).includes('visuals'), false);
  }
});

test('the evaluation endpoint accepts exactly one valid choice per case, in order', () => {
  const choices = scenarios.map((scenario) => ({ id: scenario.id, selected: 'a' }));
  assert.equal(validateChoices(choices), true);
  assert.equal(validateChoices(choices.slice(1)), false);
  assert.equal(validateChoices([{ ...choices[0], selected: 'c' }, ...choices.slice(1)]), false);
  assert.equal(validateChoices([choices[1], choices[0], ...choices.slice(2)]), false);
});
