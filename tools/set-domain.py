#!/usr/bin/env python3
"""Заменяет заглушку https://example.ru на реальный домен во всех служебных файлах."""
from __future__ import annotations

import sys
from pathlib import Path

PLACEHOLDER = "https://example.ru"
ROOT = Path(__file__).resolve().parent.parent
FILES = [
    ROOT / "js" / "config.js",
    ROOT / "index.html",
    ROOT / "robots.txt",
    ROOT / "sitemap.xml",
    ROOT / "site.webmanifest",
    *sorted((ROOT / "legal").glob("*.html")),
]


def main() -> int:
    if len(sys.argv) != 2 or not sys.argv[1].startswith("http"):
        print("Использование: python3 tools/set-domain.py https://ваш-домен.ru")
        return 1
    domain = sys.argv[1].rstrip("/")
    changed = 0
    for path in FILES:
        text = path.read_text(encoding="utf-8")
        if PLACEHOLDER not in text:
            print(f"— нет заглушки: {path.relative_to(ROOT)}")
            continue
        path.write_text(text.replace(PLACEHOLDER, domain), encoding="utf-8")
        print(f"обновлён {path.relative_to(ROOT)}")
        changed += 1
    print(f"Готово, файлов: {changed}. Проверьте реквизиты [ИП ФИО], [ИНН], [ОГРН/ОГРНИП], [email], [телефон].")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
