#!/usr/bin/env python3
"""Точечное снятие Castrol в пределах зелёной полосы."""
from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

GREEN_LO = np.array([42, 65, 30])
GREEN_HI = np.array([92, 255, 175])
REF = "f3dc0fe"


def git_bgr(rel: str) -> np.ndarray:
    data = subprocess.check_output(["git", "show", f"{REF}:{rel}"])
    tmp = tempfile.NamedTemporaryFile(suffix=".webp", delete=False)
    tmp.write(data)
    tmp.close()
    bgr = cv2.cvtColor(np.array(Image.open(tmp.name).convert("RGB")), cv2.COLOR_RGB2BGR)
    Path(tmp.name).unlink(missing_ok=True)
    return bgr


def save_webp(path: Path, bgr: np.ndarray) -> None:
    Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)).save(
        path, "WEBP", quality=82, method=6
    )


def is_logo(px: np.ndarray) -> bool:
    h, s, v = int(px[0]), int(px[1]), int(px[2])
    if v >= 165 and s <= 78:
        return True
    if (h <= 12 or h >= 168) and s >= 85:
        return True
    return False


def fill_horizontal_band_rows(
    bgr: np.ndarray, y0: int, y1: int, x0: int, x1: int, fixed_span: bool = False
) -> int:
    h, w = bgr.shape[:2]
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    green = cv2.inRange(hsv, GREEN_LO, GREEN_HI)
    touched = 0
    y0, y1 = max(0, y0), min(h, y1)
    x0, x1 = max(0, x0), min(w, x1)
    for y in range(y0, y1):
        row = green[y, x0:x1]
        runs: list[tuple[int, int]] = []
        i = 0
        while i < row.shape[0]:
            if not row[i]:
                i += 1
                continue
            j = i
            while j < row.shape[0] and row[j]:
                j += 1
            if j - i >= 3:
                runs.append((x0 + i, x0 + j - 1))
            i = j
        if not runs:
            continue
        merged: list[tuple[int, int]] = [runs[0]]
        for s, e in runs[1:]:
            ps, pe = merged[-1]
            if s - pe <= 95:
                merged[-1] = (ps, e)
            else:
                merged.append((s, e))
        span = max(merged, key=lambda r: r[1] - r[0])
        greens = [bgr[y, x] for x in range(span[0], span[1] + 1) if green[y, x]]
        if len(greens) < 2:
            continue
        fill = np.median(greens, axis=0).astype(np.uint8)
        s, e = span[0], span[1]
        while e + 1 < w and not green[y, e + 1] and is_logo(hsv[y, e + 1]):
            e += 1
        for x in range(s, e + 1):
            if green[y, x]:
                continue
            b, g, r = (int(bgr[y, x][0]), int(bgr[y, x][1]), int(bgr[y, x][2]))
            if not (
                is_logo(hsv[y, x])
                or green[y, max(0, x - 1)]
                or green[y, min(w - 1, x + 1)]
                or (r > 115 and g < 115 and b < 140)
            ):
                continue
            bgr[y, x] = fill
            touched += 1
    return touched


def fill_work14_stripe(bgr: np.ndarray) -> int:
    h, w = bgr.shape[:2]
    b0 = bgr.copy()
    hsv0 = cv2.cvtColor(b0, cv2.COLOR_BGR2HSV)
    green0 = cv2.inRange(hsv0, GREEN_LO, GREEN_HI)
    y0, y1 = int(h * 0.412), int(h * 0.465)
    x1 = int(w * 0.14)
    stripe_band = cv2.dilate(green0, np.ones((9, 9), np.uint8), iterations=2)
    mask = np.zeros((h, w), np.uint8)
    touched = 0
    for y in range(y0, min(y1, h)):
        for x in range(0, x1):
            if not stripe_band[y, x]:
                continue
            b, g, r = (int(b0[y, x][0]), int(b0[y, x][1]), int(b0[y, x][2]))
            if is_logo(hsv0[y, x]) or (r > 115 and g < 115 and b < 140):
                mask[y, x] = 255
                touched += 1
    if touched:
        mask = cv2.bitwise_and(mask, stripe_band)
        painted = cv2.inpaint(b0, mask, 2, cv2.INPAINT_TELEA)
        for y in range(y0, min(y1, h)):
            for x in range(0, x1):
                if stripe_band[y, x]:
                    bgr[y, x] = painted[y, x]
                else:
                    bgr[y, x] = b0[y, x]
    return touched


def patch_logo_near_stripe(
    bgr: np.ndarray, x0: int, y0: int, x1: int, y1: int, reach: int = 12
) -> int:
    h, w = bgr.shape[:2]
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    green = cv2.inRange(hsv, GREEN_LO, GREEN_HI)
    touched = 0
    y0, y1 = max(0, y0), min(h, y1)
    x0, x1 = max(0, x0), min(w, x1)
    for y in range(y0, y1):
        row = green[y, x0:x1]
        runs: list[tuple[int, int]] = []
        i = 0
        while i < row.shape[0]:
            if not row[i]:
                i += 1
                continue
            j = i
            while j < row.shape[0] and row[j]:
                j += 1
            if j - i >= 3:
                runs.append((x0 + i, x0 + j - 1))
            i = j
        for s, e in runs:
            greens = [bgr[y, x] for x in range(s, e + 1) if green[y, x]]
            if len(greens) < 2:
                continue
            fill = np.median(greens, axis=0).astype(np.uint8)
            while e + 1 < w and not green[y, e + 1] and is_logo(hsv[y, e + 1]) and e + 1 <= s + 55:
                e += 1
            while s - 1 >= 0 and not green[y, s - 1] and is_logo(hsv[y, s - 1]):
                s -= 1
            for x in range(s, e + 1):
                if green[y, x]:
                    continue
                bgr[y, x] = fill
                touched += 1
    return touched


def fill_diagonal_stripe(
    bgr: np.ndarray, x0: int, y0: int, x1: int, y1: int, pad: int = 6
) -> int:
    h, w = bgr.shape[:2]
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    green = cv2.inRange(hsv, GREEN_LO, GREEN_HI)
    rx0, ry0 = max(0, x0 - pad), max(0, y0 - pad)
    rx1, ry1 = min(w, x1 + pad), min(h, y1 + pad)
    ys, xs = np.where(green[ry0:ry1, rx0:rx1])
    if len(xs) < 25:
        return 0
    pts = np.column_stack(
        [xs.astype(np.float32) + rx0, ys.astype(np.float32) + ry0]
    )
    line = cv2.fitLine(pts, cv2.DIST_L2, 0, 0.01, 0.01)
    vx, vy, cx, cy = (line[i].item() for i in range(4))
    norm = (vx**2 + vy**2) ** 0.5
    perps = [abs((float(x) - cx) * vy - (float(y) - cy) * vx) / norm for x, y in pts]
    half_w = float(np.percentile(perps, 88)) + 0.5
    paras = [(float(x) - cx) * vx + (float(y) - cy) * vy for x, y in pts]
    p0, p1 = min(paras) - 3, max(paras) + 3
    touched = 0
    step = 0.45
    t = p0
    while t <= p1:
        bx, by = cx + vx * t, cy + vy * t
        samples = []
        for d in np.linspace(-half_w, half_w, int(2 * half_w) + 1):
            x = int(round(bx - vy * d / norm))
            y = int(round(by + vx * d / norm))
            if not (rx0 <= x < rx1 and ry0 <= y < ry1):
                continue
            samples.append((x, y))
        greens = [bgr[y, x] for x, y in samples if green[y, x]]
        if len(greens) < 2:
            t += step
            continue
        fill = np.median(greens, axis=0).astype(np.uint8)
        for x, y in samples:
            if green[y, x]:
                continue
            bgr[y, x] = fill
            touched += 1
        t += step
    return touched


def main() -> None:
    b8 = git_bgr("images/works/work-08.webp")
    n8 = fill_horizontal_band_rows(b8, 54, 107, 818, 960)
    save_webp(Path("images/works/work-08.webp"), b8)
    bf = git_bgr("images/works/work-08.webp")
    b800 = git_bgr("images/works/work-08-800.webp")
    sh, sw = b800.shape[0] / bf.shape[0], b800.shape[1] / bf.shape[1]
    n800 = fill_horizontal_band_rows(
        b800,
        int(54 * sh),
        int(107 * sh),
        int(818 * sw),
        int(960 * sw),
    )
    save_webp(Path("images/works/work-08-800.webp"), b800)

    b14 = git_bgr("images/works/work-14.webp")
    n14 = fill_work14_stripe(b14)
    save_webp(Path("images/works/work-14.webp"), b14)
    bf14 = git_bgr("images/works/work-14.webp")
    b14_800 = git_bgr("images/works/work-14-800.webp")
    sh, sw = b14_800.shape[0] / bf14.shape[0], b14_800.shape[1] / bf14.shape[1]
    n14_800 = fill_work14_stripe(b14_800)
    save_webp(Path("images/works/work-14-800.webp"), b14_800)

    print(f"work-08: {n8} / work-08-800: {n800}")
    print(f"work-14: {n14} / work-14-800: {n14_800}")


if __name__ == "__main__":
    main()