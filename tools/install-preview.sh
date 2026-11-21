#!/usr/bin/env bash
# Один раз на Маке: автосинк превью раз в минуту + постоянный локальный сервер на :8095.
set -euo pipefail
SRC="$(cd "$(dirname "$0")" && pwd)/sync-preview.sh"
mkdir -p "$HOME/.ml-detailing" "$HOME/Library/LaunchAgents"
cp "$SRC" "$HOME/.ml-detailing/sync-preview.sh"; chmod +x "$HOME/.ml-detailing/sync-preview.sh"
"$HOME/.ml-detailing/sync-preview.sh" --force
LA="$HOME/Library/LaunchAgents"
cat > "$LA/ru.mldetailing.preview-sync.plist" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>ru.mldetailing.preview-sync</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>$HOME/.ml-detailing/sync-preview.sh</string></array>
  <key>StartInterval</key><integer>60</integer>
  <key>RunAtLoad</key><true/>
  <key>StandardErrorPath</key><string>$HOME/.ml-detailing/preview-sync.err</string>
</dict></plist>
PL
cat > "$LA/ru.mldetailing.preview-server.plist" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>ru.mldetailing.preview-server</string>
  <key>ProgramArguments</key><array><string>/usr/bin/python3</string><string>-m</string><string>http.server</string><string>8095</string><string>--bind</string><string>127.0.0.1</string></array>
  <key>WorkingDirectory</key><string>$HOME/ML-Detailing-preview</string>
  <key>KeepAlive</key><true/>
  <key>RunAtLoad</key><true/>
  <key>StandardErrorPath</key><string>$HOME/.ml-detailing/preview-server.err</string>
</dict></plist>
PL
for n in preview-sync preview-server; do
  launchctl bootout "gui/$(id -u)/ru.mldetailing.$n" 2>/dev/null || true
  launchctl bootstrap "gui/$(id -u)" "$LA/ru.mldetailing.$n.plist"
done
echo "Превью: http://127.0.0.1:8095/  (обновляется само раз в минуту)"
