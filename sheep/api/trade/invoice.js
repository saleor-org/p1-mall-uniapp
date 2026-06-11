import request from '@/sheep/request';
import { isSaleorBff } from '@/sheep/helper/saleor';

const prefix = '/mall/v1/invoice';

const InvoiceApi = {
  getTitleList: () => {
    return request({
      url: `${prefix}/title/list`,
      method: 'GET',
      custom: { auth: true, showError: true },
    });
  },

  createTitle: (data) => {
    return request({
      url: `${prefix}/title/create`,
      method: 'POST',
      data,
      custom: { auth: true, showLoading: true, showError: true },
    });
  },

  updateTitle: (id, data) => {
    return request({
      url: `${prefix}/title/update?id=${id}`,
      method: 'PUT',
      data,
      custom: { auth: true, showLoading: true, showError: true },
    });
  },

  deleteTitle: (id) => {
    return request({
      url: `${prefix}/title/delete?id=${id}`,
      method: 'DELETE',
      custom: { auth: true, showLoading: true, showError: true },
    });
  },

  applyOrderInvoice: (orderId, titleId) => {
    if (!isSaleorBff) {
      return Promise.resolve({ code: 501, msg: '仅 Saleor BFF 模式支持发票' });
    }
    return request({
      url: `${prefix}/apply`,
      method: 'POST',
      data: { orderId, titleId },
      custom: { auth: true, showLoading: true, showSuccess: true, successMsg: '开票成功' },
    });
  },

  getOrderInvoices: (orderId) => {
    return request({
      url: `${prefix}/order?orderId=${orderId}`,
      method: 'GET',
      custom: { auth: true, showError: false },
    });
  },
};

export default InvoiceApi;
