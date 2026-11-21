#!/usr/bin/env bash
# Двойной клик на Маке: сохранить изменения в GitHub и обновить сайт.
cd "$(dirname "$0")"
read -r -p "Что поменял (Enter — без описания): " MSG
tools/deploy.sh "${MSG:-}"
read -r -p "Нажми Enter, чтобы закрыть окно"
