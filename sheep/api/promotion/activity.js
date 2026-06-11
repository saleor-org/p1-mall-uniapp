import request from '@/sheep/request';
import { isSaleorBff, saleorEmpty } from '@/sheep/helper/saleor';

const ActivityApi = {
  getActivityListBySpuId: (spuId) => {
    if (isSaleorBff) {
      return saleorEmpty.list();
    }
    return request({
      url: '/promotion/activity/list-by-spu-id',
      method: 'GET',
      params: {
        spuId,
      },
    });
  },
};

export default ActivityApi;
