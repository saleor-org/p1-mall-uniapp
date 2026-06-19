import request from '@/sheep/request';
import { isSaleorBff } from '@/sheep/helper/saleor';

const prefix = '/mall/v1/cart';

const CartApi = {
  addCart: (data) => {
    if (isSaleorBff) {
      return request({
        url: `${prefix}/add`,
        method: 'POST',
        data,
        custom: { showSuccess: true, successMsg: '已添加到购物车~', auth: true },
      });
    }
    return request({
      url: '/trade/cart/add',
      method: 'POST',
      data,
      custom: { showSuccess: true, successMsg: '已添加到购物车~' },
    });
  },
  updateCartCount: (data) => {
    if (isSaleorBff) {
      return request({
        url: `${prefix}/update-count`,
        method: 'PUT',
        data,
        custom: { auth: true },
      });
    }
    return request({
      url: '/trade/cart/update-count',
      method: 'PUT',
      data,
    });
  },
  updateCartSelected: (data) => {
    if (isSaleorBff) {
      return request({
        url: `${prefix}/update-selected`,
        method: 'PUT',
        data,
        custom: { auth: true },
      });
    }
    return request({
      url: '/trade/cart/update-selected',
      method: 'PUT',
      data,
    });
  },
  deleteCart: (ids) => {
    if (isSaleorBff) {
      return request({
        url: `${prefix}/delete`,
        method: 'DELETE',
        params: { ids },
        custom: { auth: true },
      });
    }
    return request({
      url: '/trade/cart/delete',
      method: 'DELETE',
      params: { ids },
    });
  },
  getCartList: () => {
    if (isSaleorBff) {
      return request({
        url: `${prefix}/list`,
        method: 'GET',
        custom: { showLoading: false, showError: false, auth: true },
      });
    }
    return request({
      url: '/trade/cart/list',
      method: 'GET',
      custom: { showLoading: false, auth: true },
    });
  },
};

export default CartApi;
