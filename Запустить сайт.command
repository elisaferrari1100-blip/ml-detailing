#!/bin/bash
cd "$(dirname "$0")"
echo "Сайт ML Detailing: http://127.0.0.1:8090  (закройте это окно, чтобы остановить)"
(sleep 1; open "http://127.0.0.1:8090") &
python3 -m http.server 8090
