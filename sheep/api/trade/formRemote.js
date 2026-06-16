import request from '@/sheep/request';

const prefix = '/mall/v1/form-remote';

const FormRemoteApi = {
  cascaderOptions: (params) =>
    request({
      url: `${prefix}/cascader-options`,
      method: 'GET',
      params,
      custom: { showLoading: false, showError: false },
    }),
  cascaderComplete: (data) =>
    request({
      url: `${prefix}/cascader-complete`,
      method: 'POST',
      data,
      custom: { showLoading: true, showError: true },
    }),
};

export default FormRemoteApi;
