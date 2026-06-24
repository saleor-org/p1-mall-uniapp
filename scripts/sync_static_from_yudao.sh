#!/usr/bin/env bash
# Sync Shopro/Yudao mall static assets into p1-mall-uniapp/static/.
#
# Local source: ~/yudao/yudao-mall-uniapp/static  (only ships empty-state pngs in upstream git)
# Remote source: test.yudao.iocoder.cn (diy/tabbar/order — same as yudao .env SHOPRO_STATIC_URL)
# Fallback: file.sheepjs.com for /static/img/shop/order/*
#
# Usage:
#   ./scripts/sync_static_from_yudao.sh           # skip files that are already valid images
#   ./scripts/sync_static_from_yudao.sh --force   # re-download / overwrite

set -euo pipefail

FORCE=0
[[ "${1:-}" == "--force" ]] && FORCE=1

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATIC="$ROOT/static"
YUDAO_SRC="${YUDAO_MALL_UNIAPP:-$HOME/yudao/yudao-mall-uniapp}"
CDN="${YUDAO_STATIC_CDN:-http://test.yudao.iocoder.cn}"
SHEEPJS="https://file.sheepjs.com"

DIY_ICONS=(
  sign recharge withdraw setting goods-collect goods-log feedback commission
  groupon faq point about-us privacy address invoice chat-index
)
ORDER_ICONS=(
  no_pay no_take no_comment change_order all_order
  nouse_coupon useend_coupon out_coupon all_coupon
)
TABBAR_ICONS=(
  home home-active category category-active cart cart-active user user-active
)
EXTRA=(
  img/shop/user/wallet_icon.png
  img/shop/default_avatar.png
)

copied_local=0
downloaded_cdn=0
downloaded_sheepjs=0
skipped=0
failed=0

is_image() {
  local f="$1"
  [[ -f "$f" ]] || return 1
  local h
  h="$(head -c 4 "$f" | xxd -p 2>/dev/null || true)"
  [[ "$h" == 89504e47* || "$h" == ffd8ff* || "$h" == 474946* ]]
}

copy_if_valid() {
  local src="$1" dest="$2"
  is_image "$src" || return 1
  mkdir -p "$(dirname "$dest")"
  cp -f "$src" "$dest"
  echo "  OK local $(basename "$dest")"
  copied_local=$((copied_local + 1))
  return 0
}

download_url() {
  local url="$1" dest="$2" label="$3"
  mkdir -p "$(dirname "$dest")"
  if curl -fsSL --max-time 25 "$url" -o "$dest" 2>/dev/null && is_image "$dest"; then
    echo "  OK $label $(basename "$dest")"
    return 0
  fi
  rm -f "$dest"
  return 1
}

download_cdn() {
  local rel="$1" dest="$2"
  download_url "${CDN}/static/${rel}" "$dest" "cdn" && { downloaded_cdn=$((downloaded_cdn + 1)); return 0; }
  return 1
}

download_sheepjs() {
  local rel="$1" dest="$2"
  if curl -kfsSL --max-time 25 "${SHEEPJS}/static/${rel}" -o "$dest" 2>/dev/null && is_image "$dest"; then
    echo "  OK sheepjs $(basename "$dest")"
    downloaded_sheepjs=$((downloaded_sheepjs + 1))
    return 0
  fi
  rm -f "$dest"
  return 1
}

fetch_icon() {
  local rel="$1"
  local dest="$STATIC/$rel"

  if [[ "$FORCE" -eq 0 ]] && is_image "$dest"; then
    skipped=$((skipped + 1))
    return 0
  fi

  if [[ -d "$YUDAO_SRC/static" ]] && copy_if_valid "$YUDAO_SRC/static/$rel" "$dest"; then
    return 0
  fi

  if download_cdn "$rel" "$dest"; then
    return 0
  fi

  if [[ "$rel" == img/shop/order/* || "$rel" == img/shop/user/* || "$rel" == img/shop/default_avatar.png ]]; then
    if download_sheepjs "$rel" "$dest"; then
      return 0
    fi
  fi

  echo "  FAIL $rel"
  failed=$((failed + 1))
  return 1
}

echo "== sync static → $STATIC"
echo "   yudao: $YUDAO_SRC"
echo "   cdn:   $CDN"
echo "   force: $FORCE"

if [[ -d "$YUDAO_SRC/static" ]]; then
  echo "-- rsync yudao-mall-uniapp/static (local files only)"
  rsync -a --info=stats1 "$YUDAO_SRC/static/" "$STATIC/" || true
else
  echo "   WARN: $YUDAO_SRC/static missing"
fi

echo "-- diy icons (CDN in yudao; not in git)"
for name in "${DIY_ICONS[@]}"; do
  fetch_icon "img/diy/${name}.png" || true
done

echo "-- order / coupon icons"
for name in "${ORDER_ICONS[@]}"; do
  fetch_icon "img/shop/order/${name}.png" || true
done

echo "-- tabbar icons (CDN in yudao; not in git)"
for name in "${TABBAR_ICONS[@]}"; do
  fetch_icon "img/shop/tabbar/${name}.png" || true
done

echo "-- wallet / avatar"
for rel in "${EXTRA[@]}"; do
  fetch_icon "$rel" || true
done

echo ""
echo "Summary: local=$copied_local cdn=$downloaded_cdn sheepjs=$downloaded_sheepjs skipped=$skipped failed=$failed"
if [[ "$failed" -gt 0 ]]; then
  echo "Note: diy/tabbar icons live on ${CDN} — not bundled in yudao-mall-uniapp git."
  echo "      When CDN is reachable, re-run: ./scripts/sync_static_from_yudao.sh --force"
fi
exit "$failed"
