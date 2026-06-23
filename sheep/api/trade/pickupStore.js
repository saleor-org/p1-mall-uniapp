import request from '@/sheep/request';

const prefix = '/mall/v1/pickup-stores';

const PickupStoreApi = {
  getBrands: () =>
    request({
      url: `${prefix}/brands`,
      method: 'GET',
      custom: { showLoading: false, showError: false },
    }),
  getNearby: ({ brand, lat, lng, limit = 20, maxKm }) =>
    request({
      url: `${prefix}/nearby`,
      method: 'GET',
      params: {
        brand,
        lat,
        lng,
        limit,
        ...(maxKm != null ? { maxKm } : {}),
      },
      custom: { showLoading: false, showError: false },
    }),
};

export default PickupStoreApi;
