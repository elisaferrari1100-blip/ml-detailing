#!/usr/bin/env bash
# Быстрый деплой ML Detailing: коммит только изменений -> push в GitHub -> GitHub Pages.
# Запуск:  tools/deploy.sh "что поменял"      (текущая ветка)
#          tools/deploy.sh --all "сообщение"  (плюс пуш всех локальных веток)
set -euo pipefail
cd "$(dirname "$0")/.."

REMOTE=github
REPO=elisaferrari1100-blip/ml-detailing
SITE=https://elisaferrari1100-blip.github.io/ml-detailing/
PUSH_ALL=0
if [ "${1:-}" = "--all" ]; then PUSH_ALL=1; shift; fi
MSG="${1:-Обновление сайта $(date '+%d.%m.%Y %H:%M')}"
START=$(date +%s)
BRANCH=$(git branch --show-current)
[ -n "$BRANCH" ] || { echo "Ошибка: не на ветке (detached HEAD)"; exit 1; }

# 1. Коммит только изменённых файлов (git хранит diff, ничего не перезаписывается целиком)
git add -A
if git diff --cached --quiet; then
  echo "Новых изменений нет, пушу то, что уже закоммичено."
else
  git commit -q -m "$MSG"
  echo "Коммит: $(git log -1 --format='%h %s')"
fi

# 2. Подтянуть чужие изменения поверх (rebase, без merge-мусора), если ветка уже есть на GitHub
if git ls-remote --exit-code --heads "$REMOTE" "$BRANCH" >/dev/null 2>&1; then
  git pull -q --rebase "$REMOTE" "$BRANCH" || { echo "Ошибка: конфликт при pull --rebase. Ничего не запушено. Разреши конфликт и запусти снова."; exit 1; }
fi

# 3. Пуш (обычный, без --force: история и ветки сохраняются)
git push -q -u "$REMOTE" "$BRANCH"
[ "$PUSH_ALL" = 1 ] && git push -q "$REMOTE" --all
SHA=$(git rev-parse HEAD)
echo "Push: OK ($BRANCH @ ${SHA:0:7})"

# 4. Для main ждём сборку GitHub Pages
if [ "$BRANCH" != "main" ]; then
  echo "Ветка $BRANCH сохранена на GitHub. Сайт обновляется только из main."
  echo "Готово за $(( $(date +%s) - START )) с"; exit 0
fi
echo "Жду GitHub Pages..."
for i in $(seq 1 60); do
  sleep 3
  ST=$(curl -fsS "https://api.github.com/repos/$REPO/actions/runs?head_sha=$SHA&per_page=5" 2>/dev/null \
    | python3 -c 'import sys,json
r=[x for x in json.load(sys.stdin).get("workflow_runs",[]) if "pages" in x.get("name","").lower()]
print((r[0]["status"]+":"+str(r[0]["conclusion"])) if r else "none")' 2>/dev/null || echo none)
  case "$ST" in
    completed:success) echo "Pages: OK"; echo "Done: $SITE  (за $(( $(date +%s) - START )) с)"; exit 0 ;;
    completed:*) echo "Ошибка: сборка Pages завершилась с результатом ${ST#completed:}. Смотри https://github.com/$REPO/actions"; exit 1 ;;
  esac
done
echo "Pages ещё собирается дольше 3 минут. Проверь https://github.com/$REPO/actions"; exit 1
