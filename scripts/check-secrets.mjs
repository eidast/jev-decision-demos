import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = new URL('../', import.meta.url).pathname;
const ignoredDirectories = new Set(['.git', 'node_modules']);
const localSecretFiles = /^\.env(?:\..+)?$/;
const keyPatterns = [
  new RegExp('sk' + '-or-v1-[A-Za-z0-9]{20,}', 'g'),
  new RegExp('ghp' + '_[A-Za-z0-9]{30,}', 'g'),
  new RegExp('BEGIN ' + '(?:RSA |EC |OPENSSH )?PRIVATE KEY', 'g'),
];

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return ignoredDirectories.has(entry.name) ? [] : filesIn(path);
    return entry.isFile() && !localSecretFiles.test(entry.name) ? [path] : [];
  });
}

const findings = [];
for (const path of filesIn(root)) {
  if (statSync(path).size > 2_000_000) continue;
  const content = readFileSync(path, 'utf8');
  if (keyPatterns.some((pattern) => { pattern.lastIndex = 0; return pattern.test(content); })) {
    findings.push(relative(root, path));
  }
}

try {
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root }).toString().split('\0').filter(Boolean);
  findings.push(...tracked.filter((path) => localSecretFiles.test(path.split('/').at(-1)) && path !== '.env.example'));
  execFileSync('git', ['check-ignore', '-q', '.env'], { cwd: root });
} catch (error) {
  if (error.status === 1) findings.push('.env is not ignored by Git');
  else if (error.status !== 128) throw error;
}

if (findings.length) {
  console.error(`Potential secret exposure: ${[...new Set(findings)].join(', ')}`);
  process.exitCode = 1;
} else {
  console.log('Secret scan passed.');
}
