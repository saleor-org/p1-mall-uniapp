import request from '@/sheep/request';
import { isEmpty } from '@/sheep/helper/utils';
import { isSaleorBff, saleorEmpty } from '@/sheep/helper/saleor';

const saleorPrefix = '/mall/v1/orders';

function buildSettlementQuery(data) {
  const data2 = { ...data };
  if (!(data.couponId > 0)) delete data2.couponId;
  if (!(data.addressId > 0)) delete data2.addressId;
  if (!(data.pickUpStoreId > 0)) delete data2.pickUpStoreId;
  if (isEmpty(data.receiverName)) delete data2.receiverName;
  if (isEmpty(data.receiverMobile)) delete data2.receiverMobile;
  if (!(data.combinationActivityId > 0)) delete data2.combinationActivityId;
  if (!(data.combinationHeadId > 0)) delete data2.combinationHeadId;
  if (!(data.seckillActivityId > 0)) delete data2.seckillActivityId;
  if (!(data.pointActivityId > 0)) delete data2.pointActivityId;
  if (!(data.deliveryType > 0)) delete data2.deliveryType;
  delete data2.items;
  for (let i = 0; i < data.items.length; i++) {
    data2[encodeURIComponent(`items[${i}].skuId`)] = `${data.items[i].skuId}`;
    data2[encodeURIComponent(`items[${i}].count`)] = `${data.items[i].count}`;
    if (data.items[i].cartId) {
      data2[encodeURIComponent(`items[${i}].cartId`)] = `${data.items[i].cartId}`;
    }
    if (data.items[i].formValues && Object.keys(data.items[i].formValues).length) {
      data2[encodeURIComponent(`items[${i}].formValues`)] = JSON.stringify(
        data.items[i].formValues,
      );
    }
  }
  if (data.pointStatus !== undefined) {
    data2.pointStatus = data.pointStatus;
  }
  return Object.keys(data2)
    .map((key) => `${key}=${data2[key]}`)
    .join('&');
}

const OrderApi = {
  settlementOrder: (data) => {
    const queryString = buildSettlementQuery(data);
    const url = isSaleorBff
      ? `${saleorPrefix}/settlement?${queryString}`
      : `/trade/order/settlement?${queryString}`;
    return request({
      url,
      method: 'GET',
      custom: { showError: true, showLoading: true, auth: isSaleorBff },
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

  createOrder: (data) => {
    if (isSaleorBff) {
      return request({
        url: `${saleorPrefix}/create`,
        method: 'POST',
        data,
        custom: { auth: true },
      });
    }
    return request({
      url: '/trade/order/create',
      method: 'POST',
      data,
    });
  },

  getOrderDetail: (id, sync) => {
    const url = isSaleorBff ? `${saleorPrefix}/get-detail` : '/trade/order/get-detail';
    return request({
      url,
      method: 'GET',
      params: { id, sync },
      custom: { showLoading: false, auth: isSaleorBff },
    });
  },

  getOrderPage: (params) => {
    const url = isSaleorBff ? `${saleorPrefix}/page` : '/trade/order/page';
    return request({
      url,
      method: 'GET',
      params,
      custom: { showLoading: false, auth: isSaleorBff },
    });
  },

  receiveOrder: (id) => {
    const url = isSaleorBff ? `${saleorPrefix}/receive` : '/trade/order/receive';
    return request({
      url,
      method: 'PUT',
      params: { id },
      custom: { auth: isSaleorBff },
    });
  },

  cancelOrder: (id) => {
    const url = isSaleorBff ? `${saleorPrefix}/cancel` : '/trade/order/cancel';
    return request({
      url,
      method: 'DELETE',
      params: { id },
      custom: { auth: isSaleorBff },
    });
  },

  deleteOrder: (id) => {
    const url = isSaleorBff ? `${saleorPrefix}/delete` : '/trade/order/delete';
    return request({
      url,
      method: 'DELETE',
      params: { id },
      custom: { auth: isSaleorBff },
    });
  },

  getOrderExpressTrackList: (id) => {
    if (isSaleorBff) {
      return request({
        url: `${saleorPrefix}/get-express-track-list`,
        method: 'GET',
        params: { id },
        custom: { auth: true },
      });
    }
    return request({
      url: '/trade/order/get-express-track-list',
      method: 'GET',
      params: { id },
    });
  },

  getOrderCount: () => {
    const url = isSaleorBff ? `${saleorPrefix}/get-count` : '/trade/order/get-count';
    return request({
      url,
      method: 'GET',
      custom: { showLoading: false, auth: true },
    });
  },

  createOrderItemComment: (data) => {
    if (isSaleorBff) {
      return request({
        url: `${saleorPrefix}/item/create-comment`,
        method: 'POST',
        data,
        custom: { auth: true, showSuccess: true },
      });
    }
    return request({
      url: '/trade/order/item/create-comment',
      method: 'POST',
      data,
    });
  },
};

export default OrderApi;
