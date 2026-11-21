#!/usr/bin/env bash
# Двойной клик: сразу подтянуть все ветки в локальное превью и открыть сайт.
"$HOME/.ml-detailing/sync-preview.sh" --force
open "http://127.0.0.1:8095/"
