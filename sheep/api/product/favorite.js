import request from '@/sheep/request';
import { isSaleorBff } from '@/sheep/helper/saleor';

const saleorPrefix = '/mall/v1/product/favorite';

const FavoriteApi = {
  // 获得商品收藏分页
  getFavoritePage: (data) => {
    if (isSaleorBff) {
      return request({
        url: `${saleorPrefix}/page`,
        method: 'GET',
        params: data,
        custom: { auth: true, showLoading: false },
      });
    }
    return request({
      url: '/product/favorite/page',
      method: 'GET',
      params: data,
    });
  },
  // 检查是否收藏过商品（芋道路径拼写 exits）
  isFavoriteExists: (spuId) => {
    if (isSaleorBff) {
      return request({
        url: `${saleorPrefix}/exits`,
        method: 'GET',
        params: { spuId },
        custom: { auth: true, showLoading: false, showError: false },
      });
    }
    return request({
      url: '/product/favorite/exits',
      method: 'GET',
      params: {
        spuId,
      },
    });
  },
  // 添加商品收藏
  createFavorite: (spuId) => {
    if (isSaleorBff) {
      return request({
        url: `${saleorPrefix}/create`,
        method: 'POST',
        data: { spuId },
        custom: {
          auth: true,
          showSuccess: true,
          successMsg: '收藏成功',
        },
      });
    }
    return request({
      url: '/product/favorite/create',
      method: 'POST',
      data: {
        spuId,
      },
      custom: {
        auth: true,
        showSuccess: true,
        successMsg: '收藏成功',
      },
    });
  },
  // 取消商品收藏
  deleteFavorite: (spuId) => {
    if (isSaleorBff) {
      return request({
        url: `${saleorPrefix}/delete`,
        method: 'DELETE',
        data: { spuId },
        custom: {
          auth: true,
          showSuccess: true,
          successMsg: '取消成功',
        },
      });
    }
    return request({
      url: '/product/favorite/delete',
      method: 'DELETE',
      data: {
        spuId,
      },
      custom: {
        auth: true,
        showSuccess: true,
        successMsg: '取消成功',
      },
    });
  },
};

export default FavoriteApi;
