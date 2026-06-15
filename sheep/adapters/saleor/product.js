/** Map p1-wechat-shop /mall/v1 product payloads to yudao SPU shape (prices in fen). */

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

function introFromDescription(html) {
  const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return plain.length > 80 ? `${plain.slice(0, 80)}…` : plain;
}

export function mapProductCard(item) {
  const priceFen = moneyToFen(item.price);
  const picUrl = item.thumbnail || '';
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
    salesCount: 0,
    promotionType: 0,
    promotionPrice: 0,
    categoryId: item.category?.id || null,
  };
}

export function mapProductDetail(item) {
  const card = mapProductCard(item);
  const stopFen = moneyToFen(item.priceRange?.stop) || card.price;
  const description = parseDescription(item.description);
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
        return {
          id: v.id,
          name: v.name || card.name,
          picUrl: card.picUrl,
          price: priceFen,
          marketPrice: marketFen > priceFen ? marketFen : priceFen,
          stock:
            v.quantityAvailable != null && v.quantityAvailable >= 0
              ? v.quantityAvailable
              : 99,
          properties: (v.properties || []).map((p) => ({
            propertyId: p.propertyId,
            propertyName: p.propertyName,
            valueId: p.valueId,
            valueName: p.valueName,
          })),
          goods_num: 1,
        };
      })
    : [
        {
          id: card.slug,
          name: card.name,
          picUrl: card.picUrl,
          price: card.price,
          marketPrice: stopFen,
          stock: 99,
          properties: [],
          goods_num: 1,
        },
      ];

  return {
    ...card,
    marketPrice: stopFen > card.price ? stopFen : card.price,
    introduction: introFromDescription(description),
    description,
    sliderPicUrls,
    skus,
    formSchema: item.formSchema || [],
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
