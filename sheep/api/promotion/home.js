import request from '@/sheep/request';
import { isSaleorBff } from '@/sheep/helper/saleor';

const HomeApi = {
  getHomeContent: () => {
    if (!isSaleorBff) {
      return Promise.resolve({ code: 0, data: { banners: [], notices: [] } });
    }
    return request({
      url: '/mall/v1/home/content',
      method: 'GET',
      custom: { showLoading: false, showError: false },
    });
  },
};

export default HomeApi;
