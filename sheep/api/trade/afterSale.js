import request from '@/sheep/request';
import { isSaleorBff } from '@/sheep/helper/saleor';

const saleorPrefix = '/mall/v1/after-sale';
const saleorLogPrefix = '/mall/v1/after-sale-log';

const AfterSaleApi = {
  // 获得售后分页
  getAfterSalePage: (params) => {
    if (isSaleorBff) {
      return request({
        url: `${saleorPrefix}/page`,
        method: 'GET',
        params,
        custom: { showLoading: false, auth: true },
      });
    }
    return request({
      url: `/trade/after-sale/page`,
      method: 'GET',
      params,
      custom: {
        showLoading: false,
      },
    });
  },
  // 创建售后
  createAfterSale: (data) => {
    if (isSaleorBff) {
      return request({
        url: `${saleorPrefix}/create`,
        method: 'POST',
        data,
        custom: { auth: true },
      });
    }
    return request({
      url: `/trade/after-sale/create`,
      method: 'POST',
      data,
    });
  },
  // 获得售后
  getAfterSale: (id) => {
    if (isSaleorBff) {
      return request({
        url: `${saleorPrefix}/get`,
        method: 'GET',
        params: { id },
        custom: { auth: true },
      });
    }
    return request({
      url: `/trade/after-sale/get`,
      method: 'GET',
      params: {
        id,
      },
    });
  },
  // 取消售后
  cancelAfterSale: (id) => {
    if (isSaleorBff) {
      return request({
        url: `${saleorPrefix}/cancel`,
        method: 'DELETE',
        params: { id },
        custom: { auth: true },
      });
    }
    return request({
      url: `/trade/after-sale/cancel`,
      method: 'DELETE',
      params: {
        id,
      },
    });
  },
  // 获得售后日志列表
  getAfterSaleLogList: (afterSaleId) => {
    if (isSaleorBff) {
      return request({
        url: `${saleorLogPrefix}/list`,
        method: 'GET',
        params: { afterSaleId },
        custom: { auth: true },
      });
    }
    return request({
      url: `/trade/after-sale-log/list`,
      method: 'GET',
      params: {
        afterSaleId,
      },
    });
  },
  // 退回货物
  deliveryAfterSale: (data) => {
    if (isSaleorBff) {
      return request({
        url: `${saleorPrefix}/delivery`,
        method: 'PUT',
        data,
        custom: { auth: true },
      });
    }
    return request({
      url: `/trade/after-sale/delivery`,
      method: 'PUT',
      data,
    });
  },
};

export default AfterSaleApi;
