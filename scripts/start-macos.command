#!/bin/zsh
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20 or newer is required. Install it, then run this launcher again."
  read -r '?Press Return to close...'
  exit 1
fi

node -e 'if (Number(process.versions.node.split(".")[0]) < 20) process.exit(1)' || {
  echo "Node.js 20 or newer is required."
  read -r '?Press Return to close...'
  exit 1
}

if [[ ! -f .env ]]; then
  cp .env.example .env
  chmod 600 .env
  echo "Created .env. Add an OpenRouter or Vercel AI Gateway key to enable Jev."
fi

port="${PORT:-3000}"
if [[ -z "${PORT:-}" ]]; then
  while /usr/sbin/lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; do
    (( port += 1 ))
  done
fi

url="http://127.0.0.1:${port}/"
echo "Starting Jev Decision Demos at $url"
PORT="$port" HOST=127.0.0.1 node server.js &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT INT TERM

for attempt in {1..30}; do
  if /usr/bin/curl -fsS -o /dev/null "$url" 2>/dev/null; then
    /usr/bin/open "$url"
    echo "Close this Terminal window or press Control-C to stop the server."
    wait "$server_pid"
    exit $?
  fi
  if ! kill -0 "$server_pid" 2>/dev/null; then
    wait "$server_pid"
    exit $?
  fi
  sleep 0.2
done

echo "The server did not become ready."
exit 1
