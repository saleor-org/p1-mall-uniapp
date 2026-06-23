import request from '@/sheep/request';
import { isSaleorBff, saleorEmpty } from '@/sheep/helper/saleor';
import {
  mapProductCard,
  mapProductDetail,
  mapProductPage,
} from '@/sheep/adapters/saleor/product';

const pageCursors = {};

function pageKey(params) {
  return `${params.keyword || ''}|${params.categoryId || ''}`;
}

const SpuApi = {
  getSpuListByIds: (ids) => {
    if (isSaleorBff) {
      const slugs = String(ids)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (slugs.length === 0) {
        return saleorEmpty.list();
      }
      return request({
        url: '/mall/v1/products/by-slugs',
        method: 'GET',
        params: { slugs: slugs.join(',') },
        custom: { showLoading: false, showError: false },
      }).then((res) => {
        if (res.code !== 0 || !Array.isArray(res.data)) {
          return res;
        }
        return { code: 0, data: res.data.map((item) => mapProductCard(item)) };
      });
    }
    return request({
      url: '/product/spu/list-by-ids',
      method: 'GET',
      params: { ids },
      custom: { showLoading: false, showError: false },
    });
  },

  getSettlementProduct: (spuIds) => {
    if (isSaleorBff) {
      return saleorEmpty.list();
    }
    return request({
      url: '/trade/order/settlement-product',
      method: 'GET',
      params: { spuIds },
      custom: { showLoading: false, showError: false },
    });
  },

  getSpuPage: async (params) => {
    if (isSaleorBff) {
      const key = pageKey(params);
      const pageSize = params.pageSize || 20;
      if (params.pageNo === 1) {
        pageCursors[key] = null;
      }
      const query = {
        first: pageSize,
        after: pageCursors[key] || undefined,
      };
      const url = params.keyword
        ? '/mall/v1/products/search'
        : '/mall/v1/products';
      const reqParams = params.keyword ? { ...query, q: params.keyword } : query;
      if (params.categoryId) {
        reqParams.category = params.categoryId;
      }
      const res = await request({
        url,
        method: 'GET',
        params: reqParams,
        custom: { showLoading: false, showError: false },
      });
      if (res.code !== 0) {
        return res;
      }
      const mapped = mapProductPage(res.data);
      pageCursors[key] = mapped.endCursor;
      return { code: 0, data: { list: mapped.list, total: mapped.total } };
    }
    return request({
      url: '/product/spu/page',
      method: 'GET',
      params,
      custom: { showLoading: false, showError: false },
    });
  },

  getSpuDetail: (id) => {
    if (isSaleorBff) {
      return request({
        url: `/mall/v1/products/${encodeURIComponent(id)}`,
        method: 'GET',
        custom: { showLoading: false, showError: false },
      }).then((res) => {
        if (res.code !== 0 || !res.data) {
          return res;
        }
        return { code: 0, data: mapProductDetail(res.data) };
      });
    }
    return request({
      url: '/product/spu/get-detail',
      method: 'GET',
      params: { id },
      custom: { showLoading: false, showError: false },
    });
  },
};

export default SpuApi;
