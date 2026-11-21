#!/usr/bin/env bash
# Локальное превью ML Detailing со ВСЕМИ ветками GitHub.
# Отдельный клон в ~/ML-Detailing-preview: main + все остальные ветки, влитые поверх.
# Твоя рабочая папка на рабочем столе и ветки на GitHub не меняются.
# Сайт: http://127.0.0.1:8095/
set -uo pipefail
REPO_URL=https://github.com/elisaferrari1100-blip/ml-detailing.git
DIR="$HOME/ML-Detailing-preview"
LOG="$HOME/.ml-detailing/preview.log"
EXCLUDE_RE='^(main|local-history|HEAD)$'   # local-history — старая история, её не вливаем
mkdir -p "$(dirname "$LOG")"
export GIT_TERMINAL_PROMPT=0

[ -d "$DIR/.git" ] || git clone -q "$REPO_URL" "$DIR" || { echo "$(date '+%F %T') clone failed" >>"$LOG"; exit 1; }
cd "$DIR"
git fetch -q --prune origin '+refs/heads/*:refs/remotes/origin/*' || { echo "$(date '+%F %T') fetch failed" >>"$LOG"; exit 1; }

# Собираем ключ состояния: если ни одна ветка не изменилась — ничего не делаем
STATE=$(git for-each-ref --format='%(refname:short) %(objectname)' refs/remotes/origin | sort | shasum | cut -c1-12)
[ "$STATE" = "$(cat .git/preview-state 2>/dev/null)" ] && [ "${1:-}" != "--force" ] && exit 0

git checkout -q -f --detach origin/main
git clean -qfd
MERGED=(); SKIPPED=()
for ref in $(git for-each-ref --format='%(refname:short)' refs/remotes/origin); do
  b=${ref#origin/}
  [[ "$b" =~ $EXCLUDE_RE ]] && continue
  if git -c user.name=preview -c user.email=preview@local merge -q --no-edit --no-ff "$ref" >/dev/null 2>&1; then
    MERGED+=("$b")
  else
    git merge --abort >/dev/null 2>&1; SKIPPED+=("$b")
  fi
done
echo "$STATE" > .git/preview-state
MSG="$(date '+%F %T') main@$(git rev-parse --short origin/main) влиты: ${MERGED[*]:-нет}; конфликт, пропущены: ${SKIPPED[*]:-нет}"
echo "$MSG" >>"$LOG"; echo "$MSG"
