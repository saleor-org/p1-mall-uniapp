/** 首页金刚区：从 Saleor BFF 分类列表生成 MenuSwiper 项 */

const menuBadge = { show: false, textColor: '#fff', bgColor: '#FF6000' };

function isRootParent(parentId) {
  return parentId === 0 || parentId === '0';
}

function findTopLevelId(category, byId) {
  if (isRootParent(category.parentId)) {
    return category.id;
  }
  const parent = byId.get(category.parentId);
  if (!parent) {
    return category.parentId;
  }
  return findTopLevelId(parent, byId);
}

function toMenuItem(category, byId) {
  const topId = findTopLevelId(category, byId);
  return {
    title: category.name,
    titleColor: '#333',
    iconUrl: category.picUrl || '',
    url: `/pages/index/category?id=${topId}`,
    badge: menuBadge,
  };
}

/** 优先一级分类，不足时用二级分类补足（最多 maxCount 个） */
export function pickHomeMenuCategories(flatList, maxCount = 10) {
  if (!Array.isArray(flatList) || flatList.length === 0) {
    return [];
  }
  const byId = new Map(flatList.map((c) => [c.id, c]));
  const topLevel = flatList.filter((c) => isRootParent(c.parentId));
  const topIds = new Set(topLevel.map((c) => c.id));
  const secondLevel = flatList.filter((c) => topIds.has(c.parentId));

  const picked = [];
  const used = new Set();
  const push = (c) => {
    if (picked.length >= maxCount || used.has(c.id)) {
      return;
    }
    used.add(c.id);
    picked.push(c);
  };

  for (const c of topLevel) {
    push(c);
  }
  for (const c of secondLevel) {
    push(c);
  }

  return picked.map((c) => toMenuItem(c, byId));
}

export function applyHomeMenuCategories(homeTemplate, categories, maxCount = 10) {
  if (!homeTemplate?.components) {
    return;
  }
  const menu = homeTemplate.components.find((c) => c.id === 'MenuSwiper');
  if (!menu) {
    return;
  }
  const items = pickHomeMenuCategories(categories, maxCount);
  if (items.length) {
    menu.property.list = items;
  }
}
