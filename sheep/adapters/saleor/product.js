/** Map p1-mall-bff /mall/v1 product payloads to yudao SPU shape (prices in fen). */

function moneyToFen(money) {
  if (!money || money.amount == null) {
    return 0;
  }
  const amount = parseFloat(money.amount);
  if (Number.isNaN(amount)) {
    return 0;
  }
  return Math.round(amount * 100);
}

function parseDescription(raw) {
  if (!raw) {
    return '';
  }
  if (typeof raw !== 'string') {
    return String(raw);
  }
  if (!raw.startsWith('{')) {
    return raw;
  }
  try {
    const doc = JSON.parse(raw);
    if (Array.isArray(doc.blocks)) {
      return doc.blocks
        .map((block) => block?.data?.text || '')
        .filter(Boolean)
        .join('<br/>');
    }
  } catch (_) {
    /* keep raw */
  }
  return raw;
}

function plainFromDescription(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** 供货商同步占位行：非 C 端文案，与价格/库存/规格区重复 */
const SUPPLIER_PLACEHOLDER_LINE = /^(商品类型|面值|供货价|库存|购买数量)\s*[：:]/;

function isSupplierPlaceholderLine(line) {
  const plain = String(line || '')
    .replace(/<[^>]+>/g, '')
    .trim();
  return !plain || SUPPLIER_PLACEHOLDER_LINE.test(plain);
}

function stripSupplierPlaceholderLines(text) {
  return String(text || '')
    .split(/\n|<br\s*\/?>/gi)
    .map((line) => line.trim())
    .filter((line) => line && !isSupplierPlaceholderLine(line))
    .join('<br/>');
}

function customerFacingDescription(raw) {
  return stripSupplierPlaceholderLines(parseDescription(raw));
}

export function mapProductCard(item) {
  const priceFen = moneyToFen(item.price);
  const picUrl = item.thumbnail || '';
  const realSales = Number(item.salesCount) || 0;
  const virtualSales = Number(item.virtualSalesCount) || 0;
  return {
    id: item.slug,
    slug: item.slug,
    saleorId: item.id,
    name: item.name,
    picUrl,
    image: picUrl,
    price: priceFen,
    marketPrice: priceFen,
    stock: 99,
    salesCount: realSales + virtualSales,
    virtualSalesCount: virtualSales,
    sales_show_type: 'exact',
    promotionType: 0,
    promotionPrice: 0,
    categoryId: item.category?.id || null,
  };
}

function parseBuyCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count) || count <= 0) {
    return null;
  }
  return Math.floor(count);
}

function resolveSkuBuyLimits(variant) {
  const buyMinCount = parseBuyCount(variant.buyMinCount) || 1;
  const buyMaxCount = parseBuyCount(variant.buyMaxCount);
  return { buyMinCount, buyMaxCount };
}

export function mapProductDetail(item) {
  const card = mapProductCard(item);
  const stopFen = moneyToFen(item.priceRange?.stop) || card.price;
  const description = customerFacingDescription(item.description);
  const sliderPicUrls = (item.media || []).map((m) => m.url).filter(Boolean);
  if (sliderPicUrls.length === 0 && card.picUrl) {
    sliderPicUrls.push(card.picUrl);
  }

  const variants = item.variants || [];
  const skus = variants.length
    ? variants.map((v) => {
        const priceFen = moneyToFen(v.price) || card.price;
        const marketFen =
          moneyToFen(v.priceUndiscounted) || stopFen || priceFen;
        const stock =
          v.quantityAvailable != null && v.quantityAvailable >= 0
            ? v.quantityAvailable
            : 0;
        const { buyMinCount, buyMaxCount } = resolveSkuBuyLimits(v);
        return {
          id: v.id,
          name: v.name || card.name,
          picUrl: card.picUrl,
          price: priceFen,
          marketPrice: marketFen > priceFen ? marketFen : priceFen,
          stock,
          buyMinCount,
          buyMaxCount,
          properties: (v.properties || []).map((p) => ({
            propertyId: p.propertyId,
            propertyName: p.propertyName,
            valueId: p.valueId,
            valueName: p.valueName,
          })),
          goods_num: buyMinCount,
        };
      })
    : [
        {
          id: card.slug,
          name: card.name,
          picUrl: card.picUrl,
          price: card.price,
          marketPrice: stopFen,
          stock: 0,
          properties: [],
          goods_num: 1,
        },
      ];

  const spuStock = skus.reduce((max, sku) => Math.max(max, sku.stock || 0), 0);

  return {
    ...card,
    stock: spuStock,
    marketPrice: stopFen > card.price ? stopFen : card.price,
    introduction: plainFromDescription(description),
    description,
    sliderPicUrls,
    skus,
    formSchema: item.formSchema || [],
    formBindData: item.formBindData || {},
  };
}

export function mapProductPage(data) {
  return {
    list: (data.items || []).map(mapProductCard),
    total: data.page?.totalCount ?? (data.items || []).length,
    hasNextPage: Boolean(data.page?.hasNextPage),
    endCursor: data.page?.endCursor ?? null,
  };
}
