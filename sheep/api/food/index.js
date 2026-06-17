import request from '@/sheep/request';

const prefix = '/mall/v1/food';

const FoodApi = {
  getCities: () =>
    request({
      url: `${prefix}/cities`,
      method: 'GET',
      custom: { showLoading: false },
    }),

  getStores: ({ brand, cityId = '', lat, lng, keyword = '' }) =>
    request({
      url: `${prefix}/${brand}/stores`,
      method: 'GET',
      params: {
        cityId,
        lat,
        lng,
        keyword,
      },
      custom: { showLoading: true },
    }),
};

export default FoodApi;
