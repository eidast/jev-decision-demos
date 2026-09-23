import test from 'node:test';
import assert from 'node:assert/strict';
import { scenarios, validateChoices } from '../scenarios.js';

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

test('the evaluation endpoint accepts exactly one valid choice per case, in order', () => {
  const choices = scenarios.map((scenario) => ({ id: scenario.id, selected: 'a' }));
  assert.equal(validateChoices(choices), true);
  assert.equal(validateChoices(choices.slice(1)), false);
  assert.equal(validateChoices([{ ...choices[0], selected: 'c' }, ...choices.slice(1)]), false);
  assert.equal(validateChoices([choices[1], choices[0], ...choices.slice(2)]), false);
});
