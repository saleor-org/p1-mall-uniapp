import sheep from '@/sheep';

/** 餐饮品牌 slug（Saleor 分类）→ 有票票 brand */
export const FOOD_BRAND_BY_CATEGORY = {
  mcdonalds: 'mdl',
  kfc: 'kfc',
};

/**
 * 统一进入到店点餐流程（P0：选店页；P1：菜单/购物车）
 */
export function openFoodFlow({ brand, mode = 'dinein', title = '' } = {}) {
  const key = String(brand || '').trim();
  if (!key) {
    uni.showToast({ title: '缺少品牌参数', icon: 'none' });
    return;
  }
  sheep.$router.go('/pages/order/food/store-list', {
    brand: key,
    mode,
    title,
  });
}

export function foodBrandFromCategory(category) {
  if (!category) {
    return '';
  }
  return category.foodBrand || FOOD_BRAND_BY_CATEGORY[category.id] || '';
}

export function isFoodBrandCategory(category) {
  return category?.categoryType === 'food-brand' || !!foodBrandFromCategory(category);
}
