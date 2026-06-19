import request from '@/sheep/request';
import { isSaleorBff } from '@/sheep/helper/saleor';

const saleorPrefix = '/mall/v1/product/browse-history';

const SpuHistoryApi = {
  // 记录商品浏览（Saleor：写入 Customer privateMetadata）
  recordBrowseHistory: (spuId, productId) => {
    if (isSaleorBff) {
      return request({
        url: `${saleorPrefix}/record`,
        method: 'POST',
        data: { spuId, productId },
        custom: {
          auth: true,
          showLoading: false,
          showError: false,
        },
      });
    }
    return Promise.resolve({ code: 0, data: true });
  },
  // 删除商品浏览记录
  deleteBrowseHistory: (spuIds) => {
    if (isSaleorBff) {
      return request({
        url: `${saleorPrefix}/delete`,
        method: 'DELETE',
        data: { spuIds },
        custom: {
          auth: true,
          showSuccess: true,
          successMsg: '删除成功',
        },
      });
    }
    return request({
      url: '/product/browse-history/delete',
      method: 'DELETE',
      data: { spuIds },
      custom: {
        showSuccess: true,
        successMsg: '删除成功',
      },
    });
  },
  // 清空商品浏览记录
  cleanBrowseHistory: () => {
    if (isSaleorBff) {
      return request({
        url: `${saleorPrefix}/clean`,
        method: 'DELETE',
        custom: {
          auth: true,
          showSuccess: true,
          successMsg: '清空成功',
        },
      });
    }
    return request({
      url: '/product/browse-history/clean',
      method: 'DELETE',
      custom: {
        showSuccess: true,
        successMsg: '清空成功',
      },
    });
  },
  // 获得商品浏览记录分页
  getBrowseHistoryPage: (data) => {
    if (isSaleorBff) {
      return request({
        url: `${saleorPrefix}/page`,
        method: 'GET',
        params: data,
        custom: {
          auth: true,
          showLoading: false,
        },
      });
    }
    return request({
      url: '/product/browse-history/page',
      method: 'GET',
      data,
      custom: {
        showLoading: false,
      },
    });
  },
};
export default SpuHistoryApi;
