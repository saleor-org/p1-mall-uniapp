import request from '@/sheep/request';
import { isSaleorBff, saleorEmpty } from '@/sheep/helper/saleor';

const saleorUserPrefix = '/mall/v1/trade/brokerage-user';

const BrokerageApi = {
  // 绑定分销用户
  bindBrokerageUser: (data) => {
    if (isSaleorBff) {
      return request({
        url: `${saleorUserPrefix}/bind`,
        method: 'PUT',
        data,
        custom: { auth: true, showError: false },
      });
    }
    return request({
      url: '/trade/brokerage-user/bind',
      method: 'PUT',
      data,
    });
  },
  // 获得个人分销信息
  getBrokerageUser: () => {
    if (isSaleorBff) {
      return request({
        url: `${saleorUserPrefix}/get`,
        method: 'GET',
        custom: { auth: true, showLoading: false },
      });
    }
    return request({
      url: '/trade/brokerage-user/get',
      method: 'GET',
    });
  },
  // 获得个人分销统计
  getBrokerageUserSummary: () => {
    if (isSaleorBff) {
      return request({
        url: `${saleorUserPrefix}/get-summary`,
        method: 'GET',
        custom: { auth: true, showLoading: false },
      });
    }
    return request({
      url: '/trade/brokerage-user/get-summary',
      method: 'GET',
    });
  },
  // 获得分销记录分页
  getBrokerageRecordPage: (params) => {
    if (isSaleorBff) {
      return request({
        url: '/mall/v1/trade/brokerage-record/page',
        method: 'GET',
        params,
        custom: { auth: true, showLoading: false },
      });
    }
    if (params.status === undefined) {
      delete params.status;
    }
    const queryString = Object.keys(params)
      .map((key) => encodeURIComponent(key) + '=' + params[key])
      .join('&');
    return request({
      url: `/trade/brokerage-record/page?${queryString}`,
      method: 'GET',
    });
  },
  // 创建分销提现
  createBrokerageWithdraw: (data) => {
    if (isSaleorBff) {
      return request({
        url: '/mall/v1/trade/brokerage-withdraw/create',
        method: 'POST',
        data,
        custom: { auth: true },
      });
    }
    return request({
      url: '/trade/brokerage-withdraw/create',
      method: 'POST',
      data,
    });
  },
  // 获得分销提现分页
  getBrokerageWithdrawPage: (params) => {
    if (isSaleorBff) {
      return request({
        url: '/mall/v1/trade/brokerage-withdraw/page',
        method: 'GET',
        params,
        custom: { auth: true, showLoading: false },
      });
    }
    const queryString = Object.keys(params)
      .map((key) => encodeURIComponent(key) + '=' + params[key])
      .join('&');
    return request({
      url: `/trade/brokerage-withdraw/page?${queryString}`,
      method: 'GET',
    });
  },
  // 获得分销提现详情
  getBrokerageWithdraw: (id) => {
    if (isSaleorBff) {
      return request({
        url: '/mall/v1/trade/brokerage-withdraw/get',
        method: 'GET',
        params: { id },
        custom: { auth: true, showLoading: false },
      });
    }
    return request({
      url: `/trade/brokerage-withdraw/get`,
      method: 'GET',
      params: { id },
    });
  },
  // 获得商品的分销金额
  getProductBrokeragePrice: (spuId) => {
    if (isSaleorBff) {
      return request({
        url: '/mall/v1/trade/brokerage-record/get-product-brokerage-price',
        method: 'GET',
        params: { spuId },
        custom: { auth: true, showLoading: false, showError: false },
      });
    }
    return request({
      url: '/trade/brokerage-record/get-product-brokerage-price',
      method: 'GET',
      params: { spuId },
    });
  },
  getProductsBrokeragePrice: (spuIds) => {
    const ids = String(spuIds || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!ids.length) {
      return saleorEmpty.ok({});
    }
    if (isSaleorBff) {
      return request({
        url: '/mall/v1/trade/brokerage-record/get-products-brokerage-price',
        method: 'GET',
        params: { spuIds: ids.join(',') },
        custom: { auth: true, showLoading: false, showError: false },
      });
    }
    return Promise.all(
      ids.map((spuId) =>
        request({
          url: '/trade/brokerage-record/get-product-brokerage-price',
          method: 'GET',
          params: { spuId },
        }),
      ),
    ).then((results) => {
      const data = {};
      ids.forEach((spuId, index) => {
        const row = results[index];
        if (row?.code === 0 && row.data) {
          data[spuId] = row.data;
        }
      });
      return { code: 0, data };
    });
  },
  // 获得分销用户排行（基于佣金）
  getRankByPrice: (params) => {
    if (isSaleorBff) {
      const query = {
        ...(params.times?.[0] ? { 'times[0]': params.times[0] } : {}),
        ...(params.times?.[1] ? { 'times[1]': params.times[1] } : {}),
      };
      return request({
        url: `${saleorUserPrefix}/get-rank-by-price`,
        method: 'GET',
        params: query,
        custom: { auth: true, showLoading: false },
      });
    }
    const queryString = `times=${params.times[0]}&times=${params.times[1]}`;
    return request({
      url: `/trade/brokerage-user/get-rank-by-price?${queryString}`,
      method: 'GET',
    });
  },
  // 获得分销用户排行分页（基于佣金）
  getBrokerageUserChildSummaryPageByPrice: (params) => {
    if (isSaleorBff) {
      return request({
        url: `${saleorUserPrefix}/rank-page-by-price`,
        method: 'GET',
        params,
        custom: { auth: true, showLoading: false },
      });
    }
    const queryString = Object.keys(params)
      .map((key) => encodeURIComponent(key) + '=' + params[key])
      .join('&');
    return request({
      url: `/trade/brokerage-user/rank-page-by-price?${queryString}`,
      method: 'GET',
    });
  },
  // 获得分销用户排行分页（基于用户量）
  getBrokerageUserRankPageByUserCount: (params) => {
    if (isSaleorBff) {
      return request({
        url: `${saleorUserPrefix}/rank-page-by-user-count`,
        method: 'GET',
        params,
        custom: { auth: true, showLoading: false },
      });
    }
    const queryString = Object.keys(params)
      .map((key) => encodeURIComponent(key) + '=' + params[key])
      .join('&');
    return request({
      url: `/trade/brokerage-user/rank-page-by-user-count?${queryString}`,
      method: 'GET',
    });
  },
  // 获得下级分销统计分页
  getBrokerageUserChildSummaryPage: (params) => {
    if (isSaleorBff) {
      return request({
        url: `${saleorUserPrefix}/child-summary-page`,
        method: 'GET',
        params,
        custom: { auth: true, showLoading: false },
      });
    }
    return request({
      url: '/trade/brokerage-user/child-summary-page',
      method: 'GET',
      params,
    });
  },
  // 分销员申请状态
  getBrokerageApplyStatus: () => {
    if (isSaleorBff) {
      return request({
        url: `${saleorUserPrefix}/apply-status`,
        method: 'GET',
        custom: { auth: true, showLoading: false },
      });
    }
    return saleorEmpty();
  },
  // 提交分销员申请
  createBrokerageApply: (data) => {
    if (isSaleorBff) {
      return request({
        url: `${saleorUserPrefix}/apply`,
        method: 'POST',
        data,
        custom: { auth: true },
      });
    }
    return saleorEmpty();
  },
};

export default BrokerageApi;
