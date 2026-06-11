/** Saleor BFF mode (p1-wechat-shop). Set SHOPRO_SALEOR_BFF=1 in .env */
export const isSaleorBff = import.meta.env.SHOPRO_SALEOR_BFF === '1';

/** 芋道营销/增值能力 — Saleor 模式暂不开放 */
const SALEOR_BLOCKED_ROUTE_PREFIXES = [
  '/pages/goods/seckill',
  '/pages/goods/groupon',
  '/pages/goods/point',
  '/pages/activity/',
  '/pages/commission',
  '/pages/user/wallet',
  '/pages/user/sign',
  '/pages/pay/recharge',
];

export function isSaleorBlockedRoute(page) {
  if (!isSaleorBff || !page) {
    return false;
  }
  const path = String(page).split('?')[0];
  return SALEOR_BLOCKED_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export const saleorEmpty = {
  list: () => Promise.resolve({ code: 0, data: [] }),
  page: () => Promise.resolve({ code: 0, data: { list: [], total: 0 } }),
  ok: (data = null) => Promise.resolve({ code: 0, data }),
  false: () => Promise.resolve({ code: 0, data: false }),
  walletSummary: () =>
    Promise.resolve({ code: 0, data: { totalIncome: 0, totalExpense: 0 } }),
};
