#!/usr/bin/env bash
# Start, stop or inspect a free Cloudflare Quick Tunnel for the local app.
#
# The URL is temporary and changes whenever the tunnel restarts. For a stable
# address, use a named Cloudflare Tunnel with a domain you control.
set -euo pipefail

BIN="${CLOUDFLARED_BIN:-$HOME/.local/bin/cloudflared}"
PORT="${PORT:-3000}"
LOG="${TMPDIR:-/tmp}/next-home-edit-cloudflared.log"
PIDFILE="${TMPDIR:-/tmp}/next-home-edit-cloudflared.pid"

usage() {
  echo "Usage: $0 [start|stop|status|url]"
}

running() {
  [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null
}

find_url() {
  grep -Eo 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$LOG" 2>/dev/null | head -1 || true
}

case "${1:-start}" in
  start)
    if ! command -v "$BIN" >/dev/null 2>&1; then
      echo "cloudflared not found at $BIN."
      echo "Install it with:"
      echo "  curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz | tar -xz"
      echo "  mkdir -p \"$HOME/.local/bin\" && mv cloudflared \"$HOME/.local/bin/\""
      exit 1
    fi
    if running; then
      echo "Tunnel already running: $(find_url)"
      exit 0
    fi
    : >"$LOG"
    nohup "$BIN" tunnel --url "http://localhost:$PORT" --no-autoupdate \
      >"$LOG" 2>&1 &
    echo $! >"$PIDFILE"
    for _ in $(seq 1 30); do
      url="$(find_url)"
      [ -n "$url" ] && break
      sleep 1
    done
    if [ -z "${url:-}" ]; then
      echo "Tunnel did not produce a URL. Check $LOG"
      exit 1
    fi
    echo "Public URL: $url"
    echo "Add this URL and ${url}/** to Supabase Authentication → URL Configuration."
    ;;
  stop)
    if running; then
      kill "$(cat "$PIDFILE")" 2>/dev/null || true
      rm -f "$PIDFILE"
      echo "Tunnel stopped."
    else
      echo "Tunnel is not running."
    fi
    ;;
  status)
    if running; then
      echo "Running: $(find_url)"
    else
      echo "Not running."
    fi
    ;;
  url)
    running && find_url || true
    ;;
  *)
    usage
    exit 1
    ;;
esac
