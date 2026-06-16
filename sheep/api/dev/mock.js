import request from '@/sheep/request';

const prefix = '/mall/v1/dev/mock';

const DevMockApi = {
  getConfig: () =>
    request({
      url: `${prefix}/config`,
      method: 'GET',
      custom: { showLoading: false, showError: false },
    }),

  buildOAuthPayload: (data) =>
    request({
      url: `${prefix}/oauth/build-payload`,
      method: 'POST',
      data,
      custom: { showLoading: true },
    }),
};

export default DevMockApi;
