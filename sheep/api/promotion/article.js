import request from '@/sheep/request';
import { isSaleorBff } from '@/sheep/helper/saleor';

export default {
  // 获得文章详情（Saleor：Content → Pages）
  getArticle: (id, title) => {
    if (isSaleorBff) {
      return request({
        url: '/mall/v1/content/page',
        method: 'GET',
        params: { slug: id, title },
        custom: {
          showLoading: false,
        },
      });
    }
    return request({
      url: '/promotion/article/get',
      method: 'GET',
      params: { id, title },
    });
  },
};
