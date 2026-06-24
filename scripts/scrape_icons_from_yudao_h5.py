#!/usr/bin/env python3
"""启动芋道 CDN 模式 H5，从页面网络请求中抓取 static/img 图标并写入 p1-mall-uniapp/static。"""

from __future__ import annotations

import os
import re
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
STATIC = ROOT / "static"
URLS_FILE = ROOT / "scripts" / "mall-icon-urls.txt"
H5 = os.environ.get("H5_URL", "http://127.0.0.1:3002").rstrip("/")

PNG = b"\x89PNG\r\n\x1a\n"
JPEG = b"\xff\xd8\xff"


def _is_image(data: bytes) -> bool:
    return data.startswith(PNG) or data.startswith(JPEG) or data[:6] in (b"GIF87a", b"GIF89a")


def _rel_from_url(url: str) -> str | None:
    if "/static/" not in url:
        return None
    rel = url.split("/static/", 1)[1].split("?", 1)[0]
    if not rel or "." not in rel.rsplit("/", 1)[-1]:
        return None
    return rel


def _save(rel: str, data: bytes) -> bool:
    if not _is_image(data):
        return False
    dest = STATIC / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    return True


def main() -> int:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("pip install playwright && playwright install msedge", file=sys.stderr)
        return 2

    saved: dict[str, int] = {}

    def try_save(url: str, data: bytes) -> None:
        rel = _rel_from_url(url)
        if not rel or rel in saved:
            return
        if _save(rel, data):
            saved[rel] = len(data)
            print(f"  OK {rel} ({len(data)} bytes)")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, channel="msedge")
        context = browser.new_context(viewport={"width": 390, "height": 844})
        page = context.new_page()

        def on_response(resp):
            try:
                url = resp.url
                if resp.status != 200 or "/static/" not in url:
                    return
                ct = (resp.headers.get("content-type") or "").lower()
                if "image" not in ct and "/static/img/" not in url:
                    return
                body = resp.body()
                try_save(url, body)
            except Exception:
                pass

        page.on("response", on_response)

        # 1) 浏览器上下文直接请求 CDN（有时比 WSL curl 通）
        print("== fetch via browser context ==")
        if URLS_FILE.is_file():
            for line in URLS_FILE.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                rel = _rel_from_url(line)
                if rel and rel in saved:
                    continue
                try:
                    r = context.request.get(line, timeout=20_000)
                    if r.ok:
                        try_save(line, r.body())
                except Exception as exc:
                    if rel:
                        print(f"  skip {rel}: {exc}")

        # 2) 打开芋道 CDN 模式 H5，浏览「我的」等 tab 触发加载
        print(f"== browse H5 {H5} ==")
        try:
            page.goto(H5, wait_until="domcontentloaded", timeout=60_000)
            page.wait_for_function("() => typeof uni !== 'undefined'", timeout=60_000)
            page.wait_for_timeout(2000)
            for tab_url in (
                "/pages/index/index",
                "/pages/index/category",
                "/pages/index/cart",
                "/pages/index/user",
            ):
                page.evaluate(
                    """(url) => new Promise((res, rej) => {
                      uni.switchTab({ url, success: () => res(true), fail: (e) => rej(e) });
                    })""",
                    tab_url,
                )
                page.wait_for_timeout(2500)
        except Exception as exc:
            print(f"  WARN H5 browse: {exc}")

        browser.close()

    print(f"\nSaved {len(saved)} icons under {STATIC}")
    wanted = []
    if URLS_FILE.is_file():
        for line in URLS_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                rel = _rel_from_url(line)
                if rel:
                    wanted.append(rel)
    missing = [r for r in wanted if r not in saved]
    if missing:
        print(f"Still missing ({len(missing)}):")
        for r in missing[:15]:
            print(f"  {r}")
        if len(missing) > 15:
            print(f"  ... +{len(missing) - 15}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
