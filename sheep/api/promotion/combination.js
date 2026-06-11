import request from '@/sheep/request';
import { isSaleorBff, saleorEmpty } from '@/sheep/helper/saleor';

// 拼团 API
const CombinationApi = {
  // 获得拼团活动分页
  getCombinationActivityPage: (params) => {
    if (isSaleorBff) {
      return saleorEmpty.page();
    }
    return request({
      url: '/promotion/combination-activity/page',
      method: 'GET',
      params,
    });
  },

  // 获得拼团活动明细
  getCombinationActivity: (id) => {
    if (isSaleorBff) {
      return saleorEmpty.ok(null);
    }
    return request({
      url: '/promotion/combination-activity/get-detail',
      method: 'GET',
      params: {
        id,
      },
    });
  },

  // 获得拼团活动列表，基于活动编号数组
  getCombinationActivityListByIds: (ids) => {
    if (isSaleorBff) {
      return saleorEmpty.list();
    }
    return request({
      url: '/promotion/combination-activity/list-by-ids',
      method: 'GET',
      params: {
        ids,
      },
    });
  },

  // 获得最近 n 条拼团记录（团长发起的）
  getHeadCombinationRecordList: (activityId, status, count) => {
    if (isSaleorBff) {
      return saleorEmpty.list();
    }
    return request({
      url: '/promotion/combination-record/get-head-list',
      method: 'GET',
      params: {
        activityId,
        status,
        count,
      },
    });
  },

  // 获得我的拼团记录分页
  getCombinationRecordPage: (params) => {
    if (isSaleorBff) {
      return saleorEmpty.page();
    }
    return request({
      url: '/promotion/combination-record/page',
      method: 'GET',
      params,
    });
  },

  // 获得拼团记录明细
  getCombinationRecordDetail: (id) => {
    if (isSaleorBff) {
      return saleorEmpty.ok(null);
    }
    return request({
      url: '/promotion/combination-record/get-detail',
      method: 'GET',
      params: {
        id,
      },
    });
  },

  // 获得拼团记录的概要信息
  getCombinationRecordSummary: () => {
    if (isSaleorBff) {
      return saleorEmpty.ok({ successCount: 0, userCount: 0 });
    }
    return request({
      url: '/promotion/combination-record/get-summary',
      method: 'GET',
    });
  },
};

export default CombinationApi;
