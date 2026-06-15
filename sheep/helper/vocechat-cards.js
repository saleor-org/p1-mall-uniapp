import { fen2yuan } from '@/sheep/hooks/useGoods';

/** 统一为芋道客服卡片字段（GoodsItem / OrderItem） */
export function normalizeProductForChat(data = {}) {
  const spuName = data.spuName || data.name || '';
  return {
    spuId: data.spuId || data.id || data.slug || '',
    spuName,
    picUrl: data.picUrl || data.image || '',
    price: Number(data.price || 0),
    introduction: data.introduction || data.intro || spuName,
  };
}

export function normalizeOrderForChat(data = {}) {
  const items = Array.isArray(data.items) ? data.items : [];
  return {
    id: data.id,
    no: data.no || data.number || '',
    status: data.status,
    payPrice: Number(data.payPrice || 0),
    productCount: Number(data.productCount || items.reduce((n, it) => n + Number(it.count || 0), 0)),
    items: items.map((item, idx) => ({
      id: item.id ?? idx,
      picUrl: item.picUrl || '',
      spuName: item.spuName || item.name || '',
      price: Number(item.price || 0),
      count: Number(item.count || 1),
      properties: Array.isArray(item.properties) ? item.properties : [],
    })),
  };
}

export function mapSaleorSpuToChatGoods(item) {
  return normalizeProductForChat({
    spuId: item.id || item.slug,
    spuName: item.name,
    picUrl: item.picUrl || item.image,
    price: item.price,
    introduction: item.name,
  });
}

export function formatProductSummary(product) {
  const p = normalizeProductForChat(product);
  return `【商品】${p.spuName} ¥${fen2yuan(p.price)}`;
}

export function formatOrderSummary(order) {
  const o = normalizeOrderForChat(order);
  return `【订单】${o.no} 共${o.productCount}件 ¥${fen2yuan(o.payPrice)}`;
}
