import request from '@/sheep/request';
import { isSaleorBff, saleorEmpty } from '@/sheep/helper/saleor';

const saleorPrefix = '/mall/v1/vouchers';

const CouponApi = {
  // 获得优惠劵模板列表
  getCouponTemplateListByIds: (ids) => {
    if (isSaleorBff) {
      return saleorEmpty.list();
    }
    return request({
      url: '/promotion/coupon-template/list-by-ids',
      method: 'GET',
      params: { ids },
      custom: {
        showLoading: false,
        showError: false,
      },
    });
  },
  // 获得优惠劵模版列表
  getCouponTemplateList: (spuId, productScope, count) => {
    if (isSaleorBff) {
      return request({
        url: `${saleorPrefix}/templates`,
        method: 'GET',
        params: { count },
        custom: { showLoading: false, showError: false },
      });
    }
    return request({
      url: '/promotion/coupon-template/list',
      method: 'GET',
      params: { spuId, productScope, count },
    });
  },
  // 获得优惠劵模版分页
  getCouponTemplatePage: (params) => {
    if (isSaleorBff) {
      return saleorEmpty.page();
    }
    return request({
      url: '/promotion/coupon-template/page',
      method: 'GET',
      params,
    });
  },
  // 获得优惠劵模版
  getCouponTemplate: (id) => {
    if (isSaleorBff) {
      return saleorEmpty.ok(null);
    }
    return request({
      url: '/promotion/coupon-template/get',
      method: 'GET',
      params: { id },
    });
  },
  // 我的优惠劵列表
  getCouponPage: (params) => {
    if (isSaleorBff) {
      return request({
        url: `${saleorPrefix}/page`,
        method: 'GET',
        params,
        custom: { showLoading: false, auth: true },
      });
    }
    return request({
      url: '/promotion/coupon/page',
      method: 'GET',
      params,
    });
  },
  // 领取优惠券
  takeCoupon: (templateId) => {
    if (isSaleorBff) {
      return request({
        url: `${saleorPrefix}/take`,
        method: 'POST',
        data: { templateId },
        custom: {
          auth: true,
          showLoading: true,
          loadingMsg: '领取中',
          showSuccess: true,
          successMsg: '领取成功',
        },
      });
    }
    return request({
      url: '/promotion/coupon/take',
      method: 'POST',
      data: { templateId },
      custom: {
        auth: true,
        showLoading: true,
        loadingMsg: '领取中',
        showSuccess: true,
        successMsg: '领取成功',
      },
    });
  },
  // 获得优惠劵
  getCoupon: (id) => {
    if (isSaleorBff) {
      return saleorEmpty.ok(null);
    }
    return request({
      url: '/promotion/coupon/get',
      method: 'GET',
      params: { id },
    });
  },
  // 获得未使用的优惠劵数量
  getUnusedCouponCount: () => {
    if (isSaleorBff) {
      return request({
        url: `${saleorPrefix}/unused-count`,
        method: 'GET',
        custom: { showLoading: false, auth: true },
      });
    }
    return request({
      url: '/promotion/coupon/get-unused-count',
      method: 'GET',
      custom: {
        showLoading: false,
        auth: true,
      },
    });
  },
};

export default CouponApi;
