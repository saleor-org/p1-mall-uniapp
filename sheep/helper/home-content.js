/** 首页轮播 / 公告：从 Saleor Collection + Page 映射到装修组件数据 */

export function applyHomeBanners(homeTemplate, banners = []) {
  if (!homeTemplate?.components || !Array.isArray(banners) || !banners.length) {
    return;
  }
  const carousel = homeTemplate.components.find((c) => c.id === 'Carousel');
  if (!carousel) {
    return;
  }
  carousel.property.items = banners.map((item) => ({
    type: 'img',
    imgUrl: item.imgUrl,
    videoUrl: '',
    url: item.url || '',
  }));
}

export function applyHomeNotices(homeTemplate, notices = []) {
  if (!homeTemplate?.components || !Array.isArray(notices) || !notices.length) {
    return;
  }
  const notice = homeTemplate.components.find((c) => c.id === 'NoticeBar');
  if (!notice) {
    return;
  }
  notice.property.contents = notices.map((item) => ({
    text: item.text,
    url: item.url || '',
  }));
}
