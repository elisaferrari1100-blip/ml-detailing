#!/usr/bin/env python3
"""Убрать Castrol с зелёной полосы (шаблон + зелёная заливка)."""
from __future__ import annotations

import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

GREEN_LO = np.array([42, 65, 30])
GREEN_HI = np.array([92, 255, 175])
FALLBACK_FILL = np.array([33, 77, 66], np.uint8)


def load_bgr(path: Path) -> np.ndarray:
    return cv2.cvtColor(np.array(Image.open(path).convert("RGB")), cv2.COLOR_RGB2BGR)


def save_webp(path: Path, bgr: np.ndarray) -> None:
    Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)).save(path, "WEBP", quality=82, method=6)


def build_templates() -> list[np.ndarray]:
    right = load_bgr(Path("/opt/cursor/artifacts/castrol-before/works_work-01.webp"))
    tpls = [cv2.cvtColor(right[202:222, 1145:1205], cv2.COLOR_BGR2GRAY)]
    left_path = Path("/opt/cursor/artifacts/castrol-left-tpl.png")
    if left_path.exists():
        left = load_bgr(left_path)
        tpls.append(cv2.cvtColor(left, cv2.COLOR_BGR2GRAY))
    return tpls


TEMPLATES = build_templates()


def stripe_fill(hsv: np.ndarray, bgr: np.ndarray, x: int, y: int, w: int, h: int) -> np.ndarray:
    region = bgr[max(0, y - 8) : y + h + 8, max(0, x - 24) : x + w + 24]
    hsv_r = hsv[max(0, y - 8) : y + h + 8, max(0, x - 24) : x + w + 24]
    green = cv2.inRange(hsv_r, GREEN_LO, GREEN_HI)
    if np.any(green):
        return np.median(region[green > 0], axis=0).astype(np.uint8)
    return FALLBACK_FILL


def remove_castrol(bgr: np.ndarray) -> tuple[np.ndarray, bool, str]:
    h, w_img = bgr.shape[:2]
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)

    best = None
    for base in TEMPLATES:
        for scale in [0.4, 0.5, 0.6, 0.75, 0.9, 1.05, 1.2, 1.4, 1.65, 2.0]:
            tpl = cv2.resize(base, (0, 0), fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
            th, tw = tpl.shape
            if th >= h or tw >= w_img:
                continue
            res = cv2.matchTemplate(gray, tpl, cv2.TM_CCOEFF_NORMED)
            _, maxv, _, (x, y) = cv2.minMaxLoc(res)
            if best is None or maxv > best[0]:
                best = (maxv, x, y, tw, th)

    if best is None:
        return bgr, False, "match=0"

    score, x, y, tw, th = best
    top_logo = y < h * 0.22 and score >= 0.43
    studio_logo = score >= 0.44 and y < h * 0.62
    if not (top_logo or studio_logo):
        return bgr, False, f"match={score:.2f}"

    pad_x, pad_y = 10, 4
    x0, y0 = max(0, x - pad_x), max(0, y - pad_y)
    x1, y1 = min(w_img, x + tw + pad_x), min(h, y + th + pad_y)

    expand = hsv[max(0, y - 10) : min(h, y + th + 10), max(0, x - 40) : min(w_img, x + tw + 40)]
    if cv2.inRange(expand, GREEN_LO, GREEN_HI).sum() < 255 * 8:
        return bgr, False, f"no-stripe={score:.2f}"

    fill = stripe_fill(hsv, bgr, x, y, tw, th)
    out = bgr.copy()
    out[y0:y1, x0:x1] = fill
    return out, True, f"match={score:.2f} box=({x0},{y0})-({x1},{y1})"


def fallback_relative(bgr: np.ndarray) -> tuple[np.ndarray, bool, str]:
    h, w = bgr.shape[:2]
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    if w / max(h, 1) > 1.15:
        boxes = [(int(w * 0.885), int(h * 0.235), int(w * 0.945), int(h * 0.285))]
        boxes += [(int(w * 0.06), int(h * 0.14), int(w * 0.16), int(h * 0.22))]
    else:
        boxes = [(int(w * 0.84), int(h * 0.415), int(w * 0.945), int(h * 0.475))]
    touched = 0
    out = bgr.copy()
    for x0, y0, x1, y1 in boxes:
        patch = hsv[y0:y1, x0:x1]
        sub = out[y0:y1, x0:x1]
        green = cv2.inRange(patch, GREEN_LO, GREEN_HI)
        if green.sum() < 255 * 6:
            continue
        fill = np.median(sub[green > 0], axis=0).astype(np.uint8)
        logo = cv2.inRange(patch, np.array([0, 0, 178]), np.array([180, 70, 255]))
        logo = cv2.bitwise_or(
            logo,
            cv2.bitwise_or(
                cv2.inRange(patch, np.array([0, 110, 100]), np.array([10, 255, 255])),
                cv2.inRange(patch, np.array([170, 110, 100]), np.array([180, 255, 255])),
            ),
        )
        logo = cv2.bitwise_and(logo, cv2.bitwise_not(green))
        if logo.sum() < 255:
            continue
        sub[logo > 0] = fill
        out[y0:y1, x0:x1] = sub
        touched += int(logo.sum() / 255)
    if touched < 4:
        return out, False, "fallback=0"
    return out, True, f"fallback px≈{touched}"


SKIP_NAMES = {"wash.webp", "wash-800.webp", "tint.webp", "tint-800.webp", "pair-0-before.webp", "pair-0-after.webp"}


def main() -> int:
    roots = [Path(p) for p in (sys.argv[1:] or ["images/works", "images/services", "images/before-after"])]
    for root in roots:
        if not root.is_dir():
            continue
        for path in sorted(root.glob("*.webp")):
            bgr = load_bgr(path)
            out, ok, info = remove_castrol(bgr)
            if not ok and path.name not in SKIP_NAMES:
                out, ok, info = fallback_relative(bgr)
            if ok:
                save_webp(path, out)
                print(f"OK {path}: {info}")
            else:
                print(f"SKIP {path}: {info}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())