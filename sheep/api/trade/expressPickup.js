import request from '@/sheep/request';

const prefix = '/mall/v1/express-pickup';

const ExpressPickupApi = {
  getConfig: () =>
    request({
      url: `${prefix}/config`,
      method: 'GET',
      custom: { showLoading: false, showError: false },
    }),

  getCarriers: () =>
    request({
      url: `${prefix}/carriers`,
      method: 'GET',
    }),

  quote: (data) =>
    request({
      url: `${prefix}/quote`,
      method: 'POST',
      data,
      timeout: 30000,
      custom: { showLoading: false, showError: false },
    }),

  quoteAll: (data) =>
    request({
      url: `${prefix}/quote-all`,
      method: 'POST',
      data,
      timeout: 60000,
      custom: { showLoading: false, showError: false },
    }),

  create: (data) =>
    request({
      url: `${prefix}/create`,
      method: 'POST',
      data,
      custom: { auth: true, showLoading: true, showError: true },
    }),

  get: (id) =>
    request({
      url: `${prefix}/get`,
      method: 'GET',
      params: { id },
      custom: { auth: true },
    }),

  page: (params) =>
    request({
      url: `${prefix}/page`,
      method: 'GET',
      params,
      custom: { auth: true },
    }),

  cancel: (data) =>
    request({
      url: `${prefix}/cancel`,
      method: 'POST',
      data,
      custom: { auth: true, showLoading: true },
    }),

  tracks: (id) =>
    request({
      url: `${prefix}/tracks`,
      method: 'GET',
      params: { id },
      custom: { auth: true },
    }),
};

export default ExpressPickupApi;
