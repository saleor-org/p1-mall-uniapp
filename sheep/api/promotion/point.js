import request from '@/sheep/request';
import { isSaleorBff, saleorEmpty } from '@/sheep/helper/saleor';

const PointApi = {
  // 获得积分商城活动分页
  getPointActivityPage: (params) => {
    if (isSaleorBff) {
      return saleorEmpty.page();
    }
    return request({ url: 'promotion/point-activity/page', method: 'GET', params });
  },

  // 获得积分商城活动列表，基于活动编号数组
  getPointActivityListByIds: (ids) => {
    if (isSaleorBff) {
      return saleorEmpty.list();
    }
    return request({
      url: '/promotion/point-activity/list-by-ids',
      method: 'GET',
      params: {
        ids,
      },
    });
  },

  // 获得积分商城活动明细
  getPointActivity: (id) => {
    if (isSaleorBff) {
      return saleorEmpty.ok(null);
    }
    return request({
      url: 'promotion/point-activity/get-detail',
      method: 'GET',
      params: { id },
    });
  },
};

export default PointApi;
