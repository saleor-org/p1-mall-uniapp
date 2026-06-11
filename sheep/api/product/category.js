import request from '@/sheep/request';
import { isSaleorBff, saleorEmpty } from '@/sheep/helper/saleor';

const CategoryApi = {
  getCategoryList: () => {
    if (isSaleorBff) {
      return request({
        url: '/mall/v1/categories',
        method: 'GET',
        custom: { showLoading: false, showError: false },
      });
    }
    return request({
      url: '/product/category/list',
      method: 'GET',
    });
  },
  getCategoryListByIds: (ids) => {
    if (isSaleorBff) {
      return request({
        url: '/mall/v1/categories',
        method: 'GET',
        custom: { showLoading: false, showError: false },
      }).then((res) => {
        if (res.code !== 0 || !Array.isArray(res.data)) {
          return res;
        }
        const idSet = new Set(String(ids).split(',').map((s) => s.trim()));
        return {
          code: 0,
          data: res.data.filter((c) => idSet.has(String(c.id))),
        };
      });
    }
    return request({
      url: '/product/category/list-by-ids',
      method: 'GET',
      params: { ids },
    });
  },
};

export default CategoryApi;
