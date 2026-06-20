import sheep from '@/sheep';

/** 履约回写字段，不可带入再次购买结算 */
const FULFILL_RESULT_KEYS = new Set(['card_secret']);

function buyerFormValuesForReorder(item) {
  const raw = item?.formValues;
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  return Object.fromEntries(
    Object.entries(raw).filter(([key, value]) => {
      if (FULFILL_RESULT_KEYS.has(key)) {
        return false;
      }
      return String(value ?? '').trim() !== '';
    }),
  );
}

/** 从订单再次购买：单商品直达确认页，多商品进第一件商品详情 */
export function goBuyAgain(order) {
  const items = (order?.items || []).filter(
    (item) => item && (item.skuId || item.spuId),
  );
  if (!items.length) {
    uni.showToast({ title: '该订单无法再次购买', icon: 'none' });
    return;
  }
  if (items.length === 1) {
    const item = items[0];
    if (item.skuId) {
      sheep.$router.go('/pages/order/confirm', {
        data: JSON.stringify({
          items: [
            {
              skuId: item.skuId,
              count: Math.max(1, Number(item.count) || 1),
              formValues: buyerFormValuesForReorder(item),
            },
          ],
        }),
      });
      return;
    }
    sheep.$router.go('/pages/goods/index', { id: item.spuId });
    return;
  }
  sheep.$router.go('/pages/goods/index', { id: items[0].spuId });
}
