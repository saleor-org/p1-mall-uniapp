import request from '@/sheep/request';
import { isSaleorBff } from '@/sheep/helper/saleor';

const prefix = '/mall/v1/member/address';

const AddressApi = {
  getAddressList: () => {
    if (isSaleorBff) {
      return request({
        url: `${prefix}/list`,
        method: 'GET',
        custom: { auth: true },
      });
    }
    return request({
      url: '/member/address/list',
      method: 'GET',
    });
  },
  createAddress: (data) => {
    if (isSaleorBff) {
      return request({
        url: `${prefix}/create`,
        method: 'POST',
        data,
        custom: { auth: true, showSuccess: true, successMsg: '保存成功' },
      });
    }
    return request({
      url: '/member/address/create',
      method: 'POST',
      data,
      custom: { showSuccess: true, successMsg: '保存成功' },
    });
  },
  updateAddress: (data) => {
    if (isSaleorBff) {
      return request({
        url: `${prefix}/update`,
        method: 'PUT',
        data,
        custom: { auth: true, showSuccess: true, successMsg: '更新成功' },
      });
    }
    return request({
      url: '/member/address/update',
      method: 'PUT',
      data,
      custom: { showSuccess: true, successMsg: '更新成功' },
    });
  },
  getAddress: (id) => {
    if (isSaleorBff) {
      return request({
        url: `${prefix}/get`,
        method: 'GET',
        params: { id },
        custom: { auth: true },
      });
    }
    return request({
      url: '/member/address/get',
      method: 'GET',
      params: { id },
    });
  },
  deleteAddress: (id) => {
    if (isSaleorBff) {
      return request({
        url: `${prefix}/delete`,
        method: 'DELETE',
        params: { id },
        custom: { auth: true },
      });
    }
    return request({
      url: '/member/address/delete',
      method: 'DELETE',
      params: { id },
    });
  },
};

export default AddressApi;
