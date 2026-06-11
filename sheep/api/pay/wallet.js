import request from '@/sheep/request';
import { isSaleorBff, saleorEmpty } from '@/sheep/helper/saleor';

const PayWalletApi = {
  // 获取钱包
  getPayWallet() {
    if (isSaleorBff) {
      return saleorEmpty.ok({ balance: 0 });
    }
    return request({
      url: '/pay/wallet/get',
      method: 'GET',
      custom: {
        showLoading: false,
        auth: true,
      },
    });
  },
  // 获得钱包流水分页
  getWalletTransactionPage: (params) => {
    if (isSaleorBff) {
      return saleorEmpty.page();
    }
    const queryString = Object.keys(params)
      .map((key) => encodeURIComponent(key) + '=' + params[key])
      .join('&');
    return request({
      url: `/pay/wallet-transaction/page?${queryString}`,
      method: 'GET',
    });
  },
  // 获得钱包流水统计
  getWalletTransactionSummary: (params) => {
    if (isSaleorBff) {
      return saleorEmpty.walletSummary();
    }
    const queryString = `createTime=${params.createTime[0]}&createTime=${params.createTime[1]}`;
    return request({
      url: `/pay/wallet-transaction/get-summary?${queryString}`,
      method: 'GET',
    });
  },
  // 获得钱包充值套餐列表
  getWalletRechargePackageList: () => {
    if (isSaleorBff) {
      return saleorEmpty.list();
    }
    return request({
      url: '/pay/wallet-recharge-package/list',
      method: 'GET',
      custom: {
        showError: false,
        showLoading: false,
      },
    });
  },
  // 创建钱包充值记录（发起充值）
  createWalletRecharge: (data) => {
    if (isSaleorBff) {
      return saleorEmpty.ok(null);
    }
    return request({
      url: '/pay/wallet-recharge/create',
      method: 'POST',
      data,
    });
  },
  // 获得钱包充值记录分页
  getWalletRechargePage: (params) => {
    if (isSaleorBff) {
      return saleorEmpty.page();
    }
    return request({
      url: '/pay/wallet-recharge/page',
      method: 'GET',
      params,
      custom: {
        showError: false,
        showLoading: false,
      },
    });
  },
};

export default PayWalletApi;
