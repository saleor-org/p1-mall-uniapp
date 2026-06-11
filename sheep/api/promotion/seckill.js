import request from '@/sheep/request';
import { isSaleorBff, saleorEmpty } from '@/sheep/helper/saleor';

const SeckillApi = {
  // 获得秒杀时间段列表
  getSeckillConfigList: () => {
    if (isSaleorBff) {
      return saleorEmpty.list();
    }
    return request({ url: 'promotion/seckill-config/list', method: 'GET' });
  },

  // 获得当前秒杀活动
  getNowSeckillActivity: () => {
    if (isSaleorBff) {
      return saleorEmpty.ok(null);
    }
    return request({ url: 'promotion/seckill-activity/get-now', method: 'GET' });
  },

  // 获得秒杀活动分页
  getSeckillActivityPage: (params) => {
    if (isSaleorBff) {
      return saleorEmpty.page();
    }
    return request({ url: 'promotion/seckill-activity/page', method: 'GET', params });
  },

  // 获得秒杀活动列表，基于活动编号数组
  getSeckillActivityListByIds: (ids) => {
    if (isSaleorBff) {
      return saleorEmpty.list();
    }
    return request({
      url: '/promotion/seckill-activity/list-by-ids',
      method: 'GET',
      params: {
        ids,
      },
    });
  },

  /**
   * 获得秒杀活动明细
   * @param {number} id 秒杀活动编号
   * @return {*}
   */
  getSeckillActivity: (id) => {
    if (isSaleorBff) {
      return saleorEmpty.ok(null);
    }
    return request({
      url: 'promotion/seckill-activity/get-detail',
      method: 'GET',
      params: { id },
    });
  },
};

export default SeckillApi;
