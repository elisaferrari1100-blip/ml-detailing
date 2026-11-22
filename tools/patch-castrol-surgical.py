#!/usr/bin/env python3
"""Точечное удаление Castrol: исходник + только дырки/логотип на полосе."""
from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
from PIL import Image

GREEN_LO = np.array([42, 65, 30])
GREEN_HI = np.array([92, 255, 175])


def load_bgr(path: Path) -> np.ndarray:
    return cv2.cvtColor(np.array(Image.open(path).convert("RGB")), cv2.COLOR_RGB2BGR)


def save_webp(path: Path, bgr: np.ndarray) -> None:
    Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)).save(path, "WEBP", quality=82, method=6)


def row_runs(row: np.ndarray) -> list[tuple[int, int]]:
    out: list[tuple[int, int]] = []
    i, w = 0, row.shape[0]
    while i < w:
        if not row[i]:
            i += 1
            continue
        j = i
        while j < w and row[j]:
            j += 1
        out.append((i, j))
        i = j
    return out


def stripe_row_indices(green: np.ndarray, w: int, h: int) -> list[int]:
    cand: list[int] = []
    for y in range(int(h * 0.75)):
        runs = row_runs(green[y])
        if not runs:
            continue
        max_run = max(e - s for s, e in runs)
        total = int(green[y].sum() / 255)
        if max_run < max(24, int(w * 0.025)) or total > int(w * 0.52):
            continue
        cand.append(y)
    if not cand:
        return []
    clusters: list[list[int]] = []
    cur = [cand[0]]
    for y in cand[1:]:
        if y == cur[-1] + 1:
            cur.append(y)
        else:
            clusters.append(cur)
            cur = [y]
    clusters.append(cur)
    rows: list[int] = []
    for cl in clusters:
        if 3 <= len(cl) <= 32:
            rows.extend(cl)
    return sorted(set(rows))


def is_logo_hsv(px: np.ndarray) -> bool:
    h, s, v = int(px[0]), int(px[1]), int(px[2])
    if v >= 188 and s <= 60:
        return True
    if (h <= 12 or h >= 168) and s >= 100 and v >= 85:
        return True
    return False


def patch(bgr: np.ndarray) -> tuple[np.ndarray, int]:
    h, w = bgr.shape[:2]
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    green = cv2.inRange(hsv, GREEN_LO, GREEN_HI)
    rows = stripe_row_indices(green, w, h)
    touched = 0
    for y in rows:
        runs = row_runs(green[y])
        for s, e in runs:
            if e - s < 20:
                continue
            seg = bgr[y, s:e]
            gmask = green[y, s:e] > 0
            fill = np.median(seg[gmask], axis=0).astype(np.uint8) if np.any(gmask) else None
            if fill is None:
                continue
            for k in range(len(runs) - 1):
                g0, g1 = runs[k][1], runs[k + 1][0]
                gap = g1 - g0
                if 4 <= gap <= int(w * 0.14):
                    bgr[y, g0:g1] = fill
                    touched += gap
        for s, e in runs:
            if e - s < 25:
                continue
            seg = bgr[y, s:e]
            gmask = green[y, s:e] > 0
            fill = np.median(seg[gmask], axis=0).astype(np.uint8) if np.any(gmask) else None
            if fill is None:
                continue
            for x in range(s, e):
                if green[y, x]:
                    continue
                if not is_logo_hsv(hsv[y, x]):
                    continue
                left = green[y, max(s, x - 14) : x].any()
                right = green[y, x + 1 : min(e, x + 15)].any()
                if left and right:
                    bgr[y, x] = fill
                    touched += 1
    return bgr, touched


ORIG = Path("/opt/cursor/artifacts/castrol-before-fix")

FIX = [
    "work-10",
    "work-10-800",
    "work-13",
    "work-13-800",
    "work-14",
    "work-14-800",
    "work-18",
    "work-18-800",
    "work-20",
    "work-20-800",
]


def main() -> None:
    for name in FIX:
        src = ORIG / f"works_{name}.webp"
        dst = Path("images/works") / f"{name}.webp"
        bgr = load_bgr(src)
        out, n = patch(bgr)
        save_webp(dst, out)
        print(f"OK {name}: px={n}")

    # проверка остальных: если сильно отличается от исходника — откат и patch
    works = Path("images/works")
    for dst in sorted(works.glob("work-*.webp")):
        if dst.stem in FIX:
            continue
        src = ORIG / f"works_{dst.name}"
        if not src.exists():
            continue
        cur = load_bgr(dst)
        orig = load_bgr(src)
        diff = np.mean(np.abs(cur.astype(np.int16) - orig.astype(np.int16)))
        if diff > 12:
            out, n = patch(orig.copy())
            save_webp(dst, out)
            print(f"REVERT+PATCH {dst.name}: diff={diff:.1f} px={n}")


if __name__ == "__main__":
    main()