const $ = (selector) => document.querySelector(selector);
const card = $('#scenarioCard');
const progressText = $('#progressText');
const progressFill = $('#progressFill');
const progressBar = $('.progress-track');
const prevBtn = $('#prevBtn');
const nextBtn = $('#nextBtn');
const results = $('#results');
const providerPill = $('#providerPill');
const historyList = $('#historyList');

let scenarios = [];
let selections = [];
let current = 0;
let provider = 'sample';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function portraitsHtml(ids) {
  return (ids || []).filter((id) => /^[a-z]+$/.test(id)).map((id) =>
    `<img src="/MoralMachine/assets/moral-machine/${id}_passenger.svg" alt="" loading="lazy">`).join('');
}

function optionHtml(letter, outcome) {
  const selected = selections[current] === letter;
  return `<button class="option${selected ? ' selected' : ''}" type="button" data-option="${letter}" aria-pressed="${selected}">
    <span class="option-top"><span class="option-letter">${letter.toUpperCase()}</span><span class="option-action">${escapeHtml(outcome.action)}</span></span>
    <span class="outcome-portraits" aria-hidden="true"><span class="portrait-group spared">${portraitsHtml(outcome.visuals?.spared)}</span><span class="portrait-arrow">│</span><span class="portrait-group harmed">${portraitsHtml(outcome.visuals?.harmed)}</span></span>
    <strong>Spared: ${escapeHtml(outcome.spared)}</strong>
    <span class="harm"><b>Killed:</b> ${escapeHtml(outcome.harmed)}</span>
  </button>`;
}

function renderScenario() {
  const scenario = scenarios[current];
  if (!scenario) return;
  const answered = selections.filter(Boolean).length;
  progressText.textContent = `${answered} of ${scenarios.length}`;
  progressFill.style.width = `${answered / scenarios.length * 100}%`;
  progressBar.setAttribute('aria-valuenow', String(answered));
  $('#scenarioIndex').textContent = `Case ${current + 1} of ${scenarios.length}`;
  prevBtn.disabled = current === 0;
  nextBtn.disabled = !selections[current];
  nextBtn.textContent = current === scenarios.length - 1 ? 'See comparison →' : 'Next →';
  card.innerHTML = `<div class="scenario-meta"><span class="family-pill">${escapeHtml(scenario.family)}</span><span class="scenario-place">${escapeHtml(scenario.setting)}</span></div>
    <h3>Scenario ${String(current + 1).padStart(2, '0')}</h3>
    <p class="scenario-description">${escapeHtml(scenario.premise)} Which outcome would you choose?</p>
    <div class="option-grid" role="group" aria-label="Options for scenario ${current + 1}">${optionHtml('a', scenario.a)}${optionHtml('b', scenario.b)}</div>
    <p class="scenario-hint">Select an option to continue. You can go back and change your choice.</p>`;
  card.querySelectorAll('[data-option]').forEach((button) => {
    button.addEventListener('click', () => {
      selections[current] = button.dataset.option;
      renderScenario();
      card.querySelector(`[data-option="${selections[current]}"]`).focus();
    });
  });
}

function pct(value) { return `${Math.round(value * 100)}%`; }

function runDate(value) {
  return new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function showResults(report) {
  const { evaluations, scenarios: runScenarios, choices, summary } = report;
  const isReal = report.mode === 'jev';
  $('#resultSubhead').textContent = isReal
    ? `Jev evaluated all ${evaluations.length} cases through ${report.provider === 'openrouter' ? 'OpenRouter' : 'Vercel AI Gateway'}. Compare its most probable option with your choices.`
    : 'Sample mode: these numbers are illustrative and do not come from Jev. Configure an API key for a live evaluation.';
  $('#reportMeta').textContent = `Saved ${runDate(report.createdAt)} · Run ${report.id}`;
  $('#downloadReport').href = `/api/runs/${encodeURIComponent(report.id)}`;
  $('#downloadReport').download = `moral-machine-run-${report.id}.json`;
  $('#barExplanation').textContent = `The bar shows ${isReal ? "Jev's" : 'an illustrative'} probability distribution across the two options.`;
  $('#summaryCards').innerHTML = `
    <div class="summary-card"><strong>${evaluations.length}</strong><span>cases evaluated ${isReal ? 'by Jev' : 'in sample mode'}</span></div>
    <div class="summary-card"><strong>${summary.agreementCount} / ${evaluations.length}</strong><span>choices matching ${isReal ? "Jev's" : 'the sample’s'} most probable option</span></div>
    <div class="summary-card"><strong>${pct(summary.meanSelectedProbability)}</strong><span>mean probability assigned to your choices ${isReal ? 'by Jev' : 'in the sample'}</span></div>`;
  $('#resultRows').innerHTML = evaluations.map((e, index) => {
    const scenario = runScenarios[index];
    const user = choices[index].selected.toUpperCase();
    const model = e.choice.toUpperCase();
    return `<div class="result-row">
      <div class="result-top"><div class="result-name">${String(index + 1).padStart(2, '0')} · ${escapeHtml(scenario.family)}<small>${escapeHtml(scenario.setting)}</small></div>
      <div class="result-choices">You: <b>${user}</b> &nbsp;·&nbsp; ${isReal ? 'Jev' : 'Sample'}: <b class="${user === model ? '' : 'disagree'}">${model}</b></div></div>
      <div class="bar" aria-label="Option A ${pct(e.probabilities.a)}, option B ${pct(e.probabilities.b)}"><div class="bar-a" style="width:${e.probabilities.a * 100}%"></div><div class="bar-b" style="width:${e.probabilities.b * 100}%"></div></div>
      <div class="bar-labels"><span>A · ${pct(e.probabilities.a)}</span><span>B · ${pct(e.probabilities.b)}</span></div>
      <details class="run-case-details"><summary>View saved scenario</summary><p>${escapeHtml(scenario.premise)}</p>
        <div><b>A · ${escapeHtml(scenario.a.action)}</b> — Spared: ${escapeHtml(scenario.a.spared)}; Killed: ${escapeHtml(scenario.a.harmed)}</div>
        <div><b>B · ${escapeHtml(scenario.b.action)}</b> — Spared: ${escapeHtml(scenario.b.spared)}; Killed: ${escapeHtml(scenario.b.harmed)}</div>
      </details>
    </div>`;
  }).join('');
  results.classList.remove('hidden');
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadRuns() {
  try {
    const response = await fetch('/api/runs');
    if (!response.ok) throw new Error('Saved runs could not be loaded.');
    const { runs } = await response.json();
    historyList.innerHTML = runs.length ? runs.map((run) => `
      <div class="history-row"><div><strong>${escapeHtml(runDate(run.createdAt))}</strong>
      <span>${run.mode === 'jev' ? 'Jev' : 'Sample'} · ${escapeHtml(run.provider)} · ${run.summary.scenarioCount} cases · ${run.summary.agreementCount} matches</span></div>
      <div class="history-actions"><button type="button" data-run="${escapeHtml(run.id)}">View report</button><a href="/api/runs/${encodeURIComponent(run.id)}" download="moral-machine-run-${escapeHtml(run.id)}.json">Download JSON</a></div></div>`).join('')
      : '<p>No completed runs yet. Finish a session to save its report.</p>';
  } catch (error) {
    historyList.innerHTML = `<p role="alert">${escapeHtml(error.message)}</p>`;
  }
}

historyList.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-run]');
  if (!button) return;
  button.disabled = true;
  try {
    const response = await fetch(`/api/runs/${encodeURIComponent(button.dataset.run)}`);
    if (!response.ok) throw new Error('The report could not be opened.');
    showResults(await response.json());
  } catch (error) {
    historyList.insertAdjacentHTML('afterbegin', `<p role="alert">${escapeHtml(error.message)}</p>`);
  } finally {
    button.disabled = false;
  }
});

async function evaluate() {
  if (selections.some((value) => !value)) {
    current = selections.findIndex((value) => !value);
    renderScenario();
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  nextBtn.disabled = true;
  card.innerHTML = '<div class="loading" role="status"><div class="spinner" aria-hidden="true"></div><h3>Evaluating all 13 cases…</h3><p>This may take a few seconds.</p></div>';
  try {
    const response = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choices: scenarios.map((s, index) => ({ id: s.id, selected: selections[index] })) }),
    });
    const report = await response.json();
    if (!response.ok) throw new Error(report.error || 'The session could not be evaluated.');
    renderScenario();
    showResults(report);
    await loadRuns();
  } catch (error) {
    card.innerHTML = `<div class="error-box" role="alert">${escapeHtml(error.message)}</div>`;
    nextBtn.disabled = false;
    nextBtn.textContent = 'Retry evaluation →';
  }
}

prevBtn.addEventListener('click', () => {
  if (current > 0) { current--; renderScenario(); card.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
});
nextBtn.addEventListener('click', () => {
  if (current < scenarios.length - 1) { current++; renderScenario(); card.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  else evaluate();
});
$('#restartBtn').addEventListener('click', () => {
  selections = Array(scenarios.length).fill(null);
  current = 0;
  results.classList.add('hidden');
  renderScenario();
  $('#exercise').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

async function init() {
  try {
    const response = await fetch('/api/scenarios');
    if (!response.ok) throw new Error('The scenarios could not be loaded.');
    const data = await response.json();
    scenarios = data.scenarios;
    selections = Array(scenarios.length).fill(null);
    provider = data.provider;
    providerPill.textContent = provider === 'openrouter' ? 'JEV · OPENROUTER' : provider === 'vercel' ? 'JEV · VERCEL' : 'SAMPLE MODE';
    providerPill.classList.toggle('demo', provider === 'sample');
    renderScenario();
    loadRuns();
  } catch (error) {
    card.innerHTML = `<div class="error-box" role="alert">${escapeHtml(error.message)}</div>`;
    providerPill.textContent = 'OFFLINE';
  }
}

init();
