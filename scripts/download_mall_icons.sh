#!/usr/bin/env bash
# 下载「我的」页图标到 static/（本地模式用）
# test.yudao CDN → file.sheepjs.com → 本地 shop 图标 fallback（不删已有有效 PNG）
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATIC="$ROOT/static"
URLS="$ROOT/scripts/mall-icon-urls.txt"
CDN="${YUDAO_STATIC_CDN:-http://test.yudao.iocoder.cn}"
SHEEPJS="https://file.sheepjs.com"

declare -A FALLBACK=(
  ["img/diy/sign.png"]=img/shop/commission/commission_icon1.png
  ["img/diy/recharge.png"]=img/shop/commission/commission_icon1.png
  ["img/diy/withdraw.png"]=img/shop/commission/commission_icon2.png
  ["img/diy/setting.png"]=img/shop/tools/home.png
  ["img/diy/goods-collect.png"]=img/shop/tools/collect.png
  ["img/diy/goods-log.png"]=img/shop/tools/browse.png
  ["img/diy/feedback.png"]=img/shop/tools/feedback.png
  ["img/diy/commission.png"]=img/shop/commission/commission_icon1.png
  ["img/diy/groupon.png"]=img/shop/goods/groupon-tag.png
  ["img/diy/faq.png"]=img/shop/tools/service.png
  ["img/diy/point.png"]=img/shop/commission/commission_icon2.png
  ["img/diy/about-us.png"]=img/shop/tools/home.png
  ["img/diy/privacy.png"]=img/shop/tools/service.png
  ["img/diy/address.png"]=img/shop/user/address/edit.png
  ["img/diy/invoice.png"]=img/shop/tools/service.png
  ["img/diy/chat-index.png"]=img/shop/goods/message.png
  ["img/shop/tabbar/home.png"]=img/shop/tools/home.png
  ["img/shop/tabbar/home-active.png"]=img/shop/tools/home.png
  ["img/shop/tabbar/category.png"]=img/shop/tools/browse.png
  ["img/shop/tabbar/category-active.png"]=img/shop/tools/browse.png
  ["img/shop/tabbar/cart.png"]=img/shop/order/nouse_coupon.png
  ["img/shop/tabbar/cart-active.png"]=img/shop/order/nouse_coupon.png
  ["img/shop/tabbar/user.png"]=img/shop/commission/commission_icon2.png
  ["img/shop/tabbar/user-active.png"]=img/shop/commission/commission_icon2.png
)

is_png() {
  local f="$1"
  [[ -f "$f" ]] || return 1
  local h
  h="$(head -c 4 "$f" | xxd -p 2>/dev/null || true)"
  [[ "$h" == 89504e47* || "$h" == ffd8ff* ]]
}

cdn_dead() {
  local ip
  ip="$(getent ahostsv4 "${CDN#*://}" 2>/dev/null | awk '{print $1; exit}')"
  [[ "$ip" == "127.0.0.1" ]]
}

copy_fallback() {
  local rel="$1"
  local dest="$STATIC/$rel"
  if is_png "$dest"; then
    echo "KEEP $rel"
    return 0
  fi
  local src_rel="${FALLBACK[$rel]:-}"
  [[ -n "$src_rel" ]] || return 1
  local src="$STATIC/$src_rel"
  is_png "$src" || return 1
  mkdir -p "$(dirname "$dest")"
  cp -f "$src" "$dest"
  echo "OK fallback $rel"
  return 0
}

download_one() {
  local url="$1"
  local rel="${url#*/static/}"
  local dest="$STATIC/$rel"
  mkdir -p "$(dirname "$dest")"

  if is_png "$dest"; then
    echo "KEEP $rel"
    return 0
  fi

  if ! cdn_dead; then
    if curl -fsSL --connect-timeout 5 --max-time 12 "$url" -o "$dest" 2>/dev/null && is_png "$dest"; then
      echo "OK yudao $rel"
      return 0
    fi
  fi

  if curl -kfsSL --connect-timeout 8 --max-time 20 "${SHEEPJS}/static/${rel}" -o "$dest" 2>/dev/null && is_png "$dest"; then
    echo "OK sheepjs $rel"
    return 0
  fi

  copy_fallback "$rel"
}

if cdn_dead; then
  echo "WARN: ${CDN#*://} → 127.0.0.1，跳过芋道 CDN，用 sheepjs + 本地 fallback"
fi
echo "→ $STATIC"
ok=0 fail=0
while read -r url; do
  [[ -z "$url" || "$url" =~ ^# ]] && continue
  if download_one "$url"; then ok=$((ok + 1)); else fail=$((fail + 1)); fi
done < "$URLS"
echo "done: ok=$ok fail=$fail"
exit "$([[ "$fail" -eq 0 ]] && echo 0 || echo 1)"
