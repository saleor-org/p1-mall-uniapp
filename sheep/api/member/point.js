import request from '@/sheep/request';
import { isSaleorBff, saleorEmpty } from '@/sheep/helper/saleor';

const PointApi = {
  // 获得用户积分记录分页
  getPointRecordPage: (params) => {
    if (isSaleorBff) {
      return saleorEmpty.page();
    }
    if (params.addStatus === undefined) {
      delete params.addStatus;
    }
    const queryString = Object.keys(params)
      .map((key) => encodeURIComponent(key) + '=' + params[key])
      .join('&');
    return request({
      url: `/member/point/record/page?${queryString}`,
      method: 'GET',
    });
  },
};

export default PointApi;
