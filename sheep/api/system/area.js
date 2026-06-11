import request from '@/sheep/request';

const AreaApi = {
  // 获得地区树（芋道：GET /system/area/tree；Saleor BFF 同路径）
  getAreaTree: () => {
    return request({
      url: '/system/area/tree',
      method: 'GET',
      custom: {
        showLoading: false,
        showError: false,
      },
    });
  },
};

export default AreaApi;
