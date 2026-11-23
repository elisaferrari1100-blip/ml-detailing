#!/usr/bin/env python3
"""Прописать URL обработчика заявок и clientKey в js/config.js."""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "js" / "config.js"


def main() -> int:
    p = argparse.ArgumentParser(description="Подключить leads.endpoint в js/config.js")
    p.add_argument("--endpoint", required=True, help="URL Cloudflare Worker")
    p.add_argument("--client-key", default="", help="Значение leads.clientKey (X-Lead-Key)")
    args = p.parse_args()

    if not CONFIG.is_file():
        print(f"Нет файла {CONFIG}", file=sys.stderr)
        return 1

    text = CONFIG.read_text(encoding="utf-8")
    ep = args.endpoint.strip()
    if not ep.startswith("https://") and not ep.startswith("http://127.0.0.1"):
        print("endpoint должен начинаться с https:// (или http://127.0.0.1 для локальных тестов)", file=sys.stderr)
        return 1

    text, n1 = re.subn(
        r'(endpoint:\s*)"[^"]*"',
        rf'\1"{ep}"',
        text,
        count=1,
    )
    key = args.client_key.replace("\\", "\\\\").replace('"', '\\"')
    text, n2 = re.subn(
        r'(clientKey:\s*)"[^"]*"',
        rf'\1"{key}"',
        text,
        count=1,
    )
    if n1 != 1 or n2 != 1:
        print("Не удалось обновить leads.endpoint / clientKey — проверьте js/config.js", file=sys.stderr)
        return 1

    CONFIG.write_text(text, encoding="utf-8")
    print(f"OK: endpoint={ep}")
    if key:
        print("OK: clientKey задан")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())