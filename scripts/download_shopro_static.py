#!/usr/bin/env python3
"""Download Shopro/Yudao static assets into uni-app static/ for offline use."""

from __future__ import annotations

import json
import re
import ssl
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATIC = ROOT / "static"

# file.sheepjs.com has valid shop/order PNGs; cert is expired so verify=False.
SHEEPJS = "https://file.sheepjs.com"

SOURCES = (
    SHEEPJS,
    "http://mall.yudao.iocoder.cn",
    "http://test.yudao.iocoder.cn",
)

MENU_SWIPER_REMOTE = [
    ("01-tongzhuang.jpg", "http://mall.yudao.iocoder.cn/1dc5d968737a990719e95492ebc9e3f8b0308214b503c51887f442f7c7584321.jpg"),
    ("02-jiadian.jpg", "http://mall.yudao.iocoder.cn/d71510c1ca5c5e4c7dd445da9f9357bf169978ed84febeb35ccf6dc0951a18e9.jpg"),
    ("03-shuma.jpg", "http://mall.yudao.iocoder.cn/7e600e817c8ec0f2f747f41b59e1a3ac28ac850a9b77ed78d69af5fadbef700e.jpg"),
    ("04-meizhuang.png", "http://mall.yudao.iocoder.cn/e5ba252dbc6423327fec784f5775f55355f17fd6a2440919a2d91c4e541dfa81.png"),
    ("05-muying.jpg", "http://mall.yudao.iocoder.cn/7d5e76eea5f29773a8962fabb0131d012434ee4cae3ddb416d135e20f89123eb.jpg"),
    ("06-txu.png", "http://mall.yudao.iocoder.cn/1abe3ad4bcfe1f8e335873dd8718d40bbafc24a3693408966316fc827fefd771.png"),
    ("07-qunzi.png", "http://mall.yudao.iocoder.cn/8313fe1abaedf15940f77e91d797fe8f24489e13ecfef2214a2474de2a1807e6.png"),
    ("08-hanfu.jpg", "http://mall.yudao.iocoder.cn/20251008/blob_1752042302026_1759890648228.jpg"),
    ("09-hufu.png", "http://mall.yudao.iocoder.cn/a86aad413989d547e91b46b83721ac48a3271edacd05022b11c75ba2a5c0b3a8.png"),
    ("10-yundong.png", "http://mall.yudao.iocoder.cn/c204a4f7d9ffe946abe9dd9c4014f05f166d8fbb27ac4cdd55de1f7fa0821701.png"),
]

DIY_ICONS = [
    "sign.png",
    "recharge.png",
    "withdraw.png",
    "setting.png",
    "goods-collect.png",
    "goods-log.png",
    "feedback.png",
    "commission.png",
    "groupon.png",
    "faq.png",
    "point.png",
    "about-us.png",
    "privacy.png",
    "address.png",
    "invoice.png",
    "chat-index.png",
]

TABBAR_ICONS = [
    "home.png",
    "home-active.png",
    "category.png",
    "category-active.png",
    "cart.png",
    "cart-active.png",
    "user.png",
    "user-active.png",
]

IOCODER_BANNERS = [
    ("banner-01.jpg", "https://static.iocoder.cn/mall/banner-01.jpg"),
    ("banner-02.jpg", "https://static.iocoder.cn/mall/banner-02.jpg"),
]

# When remote diy/tabbar assets are unavailable, copy from bundled shop icons.
DIY_FALLBACKS: dict[str, str] = {
    # shop/app/sign.png is a 519×344 banner, not a menu icon
    "sign.png": "img/shop/commission/commission_icon1.png",
    "recharge.png": "img/shop/commission/commission_icon1.png",
    "withdraw.png": "img/shop/commission/commission_icon2.png",
    "setting.png": "img/shop/tools/home.png",
    "goods-collect.png": "img/shop/tools/collect.png",
    "goods-log.png": "img/shop/tools/browse.png",
    "feedback.png": "img/shop/tools/feedback.png",
    "commission.png": "img/shop/commission/commission_icon1.png",
    "groupon.png": "img/shop/goods/groupon-tag.png",
    "faq.png": "img/shop/tools/service.png",
    "point.png": "img/shop/commission/commission_icon2.png",
    "about-us.png": "img/shop/tools/home.png",
    "privacy.png": "img/shop/tools/service.png",
    "address.png": "img/shop/user/address/edit.png",
    "invoice.png": "img/shop/tools/service.png",
    "chat-index.png": "img/shop/goods/message.png",
}

TABBAR_FALLBACKS: dict[str, str] = {
    "home.png": "img/shop/tools/home.png",
    "home-active.png": "img/shop/tools/home.png",
    "category.png": "img/shop/tools/browse.png",
    "category-active.png": "img/shop/tools/browse.png",
    "cart.png": "img/shop/order/nouse_coupon.png",
    "cart-active.png": "img/shop/order/nouse_coupon.png",
    "user.png": "img/shop/commission/commission_icon2.png",
    "user-active.png": "img/shop/commission/commission_icon2.png",
}

_SSL_CTX = ssl.create_default_context()
_SSL_CTX.check_hostname = False
_SSL_CTX.verify_mode = ssl.CERT_NONE


def _is_valid_image(data: bytes) -> bool:
    if len(data) < 32:
        return False
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return True
    if data[:3] == b"\xff\xd8\xff":
        return True
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return True
    if data.lstrip().startswith(b"<!") or data.lstrip().startswith(b"<html"):
        return False
    return False


def _collect_static_paths() -> list[str]:
    paths: set[str] = set()
    pattern = re.compile(r"/static/img/[a-zA-Z0-9_./-]+")
    for path in ROOT.rglob("*"):
        if path.suffix not in {".vue", ".js", ".ts", ".json", ".scss"}:
            continue
        if "node_modules" in path.parts or ".git" in path.parts:
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for match in pattern.findall(text):
            if match.endswith("/"):
                continue
            if "." not in match.rsplit("/", 1)[-1]:
                continue
            paths.add(match)
    for name in DIY_ICONS:
        paths.add(f"/static/img/diy/{name}")
    for name in TABBAR_ICONS:
        paths.add(f"/static/img/shop/tabbar/{name}")
    return sorted(paths)


def _download(url: str, dest: Path) -> bool:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "saleor-mall-static-sync/2.0"})
    try:
        with urllib.request.urlopen(req, timeout=20, context=_SSL_CTX) as resp:
            data = resp.read()
        if not _is_valid_image(data):
            return False
        dest.write_bytes(data)
        return True
    except (urllib.error.URLError, TimeoutError, OSError):
        return False


def _copy_fallback(rel_src: str, dest: Path) -> bool:
    src = STATIC / rel_src
    if not src.is_file():
        return False
    try:
        data = src.read_bytes()
    except OSError:
        return False
    if not _is_valid_image(data):
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    return True


def _file_valid(path: Path) -> bool:
    if not path.is_file():
        return False
    try:
        return _is_valid_image(path.read_bytes())
    except OSError:
        return False


def _fetch_path(static_path: str) -> bool:
    rel = static_path.removeprefix("/static/")
    dest = STATIC / rel
    if _file_valid(dest):
        return True
    for base in SOURCES:
        if _download(f"{base}{static_path}", dest):
            return True
    filename = rel.rsplit("/", 1)[-1]
    if rel.startswith("img/diy/") and filename in DIY_FALLBACKS:
        return _copy_fallback(DIY_FALLBACKS[filename], dest)
    if rel.startswith("img/shop/tabbar/") and filename in TABBAR_FALLBACKS:
        return _copy_fallback(TABBAR_FALLBACKS[filename], dest)
    return False


def main() -> int:
    ok = 0
    fail: list[str] = []

    for static_path in _collect_static_paths():
        if _fetch_path(static_path):
            ok += 1
        else:
            fail.append(static_path)

    menu_dir = STATIC / "diy" / "menu-swiper"
    menu_dir.mkdir(parents=True, exist_ok=True)
    for filename, url in MENU_SWIPER_REMOTE:
        dest = menu_dir / filename
        if _file_valid(dest):
            ok += 1
            continue
        if _download(url, dest):
            ok += 1
        else:
            fail.append(url)

    banner_dir = STATIC / "diy" / "icons"
    banner_dir.mkdir(parents=True, exist_ok=True)
    for filename, url in IOCODER_BANNERS:
        dest = banner_dir / filename
        if _file_valid(dest):
            ok += 1
            continue
        if _download(url, dest):
            ok += 1
        else:
            fail.append(url)

    manifest = {
        "ok": ok,
        "failed": fail,
        "menu_swiper": [name for name, _ in MENU_SWIPER_REMOTE],
    }
    (STATIC / "diy" / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"OK downloaded/verified: {ok}")
    if fail:
        print(f"FAIL ({len(fail)}):")
        for item in fail[:30]:
            print(f"  {item}")
        if len(fail) > 30:
            print(f"  ... +{len(fail) - 30} more")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
