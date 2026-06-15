import request from '@/sheep/request';
import { isSaleorBff } from '@/sheep/helper/saleor';

const socialPrefix = '/mall/v1/member/social-user';

const SocialApi = {
  // 获得社交用户
  getSocialUser: (type) => {
    if (isSaleorBff) {
      return request({
        url: `${socialPrefix}/get`,
        method: 'GET',
        params: { type },
        custom: { showLoading: false, auth: true },
      });
    }
    return request({
      url: '/member/social-user/get',
      method: 'GET',
      params: {
        type
      },
      custom: {
        showLoading: false,
      },
    });
  },
  // 社交绑定
  socialBind: (type, code, state) => {
    if (isSaleorBff) {
      return request({
        url: `${socialPrefix}/bind`,
        method: 'POST',
        data: { type, code, state },
        custom: {
          showSuccess: true,
          loadingMsg: '绑定中',
          successMsg: '绑定成功',
          auth: true,
        },
      });
    }
    return request({
      url: '/member/social-user/bind',
      method: 'POST',
      data: {
        type,
        code,
        state
      },
      custom: {
        custom: {
          showSuccess: true,
          loadingMsg: '绑定中',
          successMsg: '绑定成功',
        },
      },
    });
  },
  // 社交绑定
  socialUnbind: (type, openid) => {
    if (isSaleorBff) {
      return request({
        url: `${socialPrefix}/unbind`,
        method: 'DELETE',
        data: { type, openid },
        custom: {
          showLoading: false,
          loadingMsg: '解除绑定',
          successMsg: '解绑成功',
          auth: true,
        },
      });
    }
    return request({
      url: '/member/social-user/unbind',
      method: 'DELETE',
      data: {
        type,
        openid
      },
      custom: {
        showLoading: false,
        loadingMsg: '解除绑定',
        successMsg: '解绑成功',
      },
    });
  },
  // 获取订阅消息模板列表
  getSubscribeTemplateList: () => {
    if (isSaleorBff) {
      return request({
        url: `${socialPrefix}/get-subscribe-template-list`,
        method: 'GET',
        custom: { showError: false, showLoading: false },
      });
    }
    return request({
      url: '/member/social-user/get-subscribe-template-list',
      method: 'GET',
      custom: {
        showError: false,
        showLoading: false,
      },
    });
  },
  // 获取微信小程序码
  getWxaQrcode: async (path, query) => {
    return await request({
      url: '/member/social-user/wxa-qrcode',
      method: 'POST',
      data: {
        scene: query,
        path,
        checkPath: false, // TODO 开发环境暂不检查 path 是否存在
      },
    });
  },
};

export default SocialApi;