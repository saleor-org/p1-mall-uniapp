import request from '@/sheep/request';
import { isSaleorBff, saleorEmpty } from '@/sheep/helper/saleor';

const TradeConfigApi = {
  // 获得交易配置
  getTradeConfig: () => {
    if (isSaleorBff) {
      return request({
        url: `/mall/v1/trade/config/get`,
        method: 'GET',
        custom: { showLoading: false },
      });
    }
    return request({
      url: `/trade/config/get`,
      method: 'GET',
      custom: {
        showLoading: false,
      },
    });
  },
};

export default TradeConfigApi;
