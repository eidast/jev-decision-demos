import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(new URL('../TicTacToe/logs/', import.meta.url));
if (!existsSync(directory)) {
  console.log('No Tic Tac Toe logs yet.');
  process.exit(0);
}

const summary = {};
for (const file of readdirSync(directory).filter((name) => /^[0-9a-f-]{36}\.jsonl$/.test(name))) {
  const events = readFileSync(join(directory, file), 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
  const start = events[0];
  if (start?.event !== 'game_started') continue;
  const policy = start.decisionPolicy || 'all-legal-jev-choice-v1';
  const group = summary[policy] ||= { games: 0, finished: 0, jevMoves: 0, suboptimalMoves: 0, failedCalls: 0 };
  group.games++;
  if (events.some((event) => event.outcome)) group.finished++;
  group.jevMoves += events.filter((event) => event.event === 'jev_moved').length;
  group.suboptimalMoves += events.filter((event) => event.event === 'jev_moved' && event.analysis?.suboptimal).length;
  group.failedCalls += events.filter((event) => event.event === 'jev_failed').length;
}
console.log(JSON.stringify(summary, null, 2));
