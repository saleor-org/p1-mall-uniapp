import request from '@/sheep/request';
import { isSaleorBff } from '@/sheep/helper/saleor';

const prefix = '/mall/v1/auth';

const AuthUtil = {
  login: (data) => {
    if (isSaleorBff) {
      return request({
        url: `${prefix}/login`,
        method: 'POST',
        data,
        custom: {
          showSuccess: true,
          loadingMsg: '登录中',
          successMsg: '登录成功',
        },
      });
    }
    return request({
      url: '/member/auth/login',
      method: 'POST',
      data,
      custom: {
        showSuccess: true,
        loadingMsg: '登录中',
        successMsg: '登录成功',
      },
    });
  },
  smsLogin: (data) => {
    if (isSaleorBff) {
      return request({
        url: `${prefix}/sms-login`,
        method: 'POST',
        data,
        custom: {
          showSuccess: true,
          loadingMsg: '登录中',
          successMsg: '登录成功',
        },
      });
    }
    return request({
      url: '/member/auth/sms-login',
      method: 'POST',
      data,
      custom: {
        showSuccess: true,
        loadingMsg: '登录中',
        successMsg: '登录成功',
      },
    });
  },
  sendSmsCode: (mobile, scene) => {
    if (isSaleorBff) {
      return request({
        url: `${prefix}/send-sms-code`,
        method: 'POST',
        data: { mobile, scene },
        custom: {
          loadingMsg: '发送中',
          showSuccess: true,
          successMsg: '发送成功',
        },
      });
    }
    return request({
      url: '/member/auth/send-sms-code',
      method: 'POST',
      data: { mobile, scene },
      custom: {
        loadingMsg: '发送中',
        showSuccess: true,
        successMsg: '发送成功',
      },
    });
  },
  logout: () => {
    if (isSaleorBff) {
      return request({
        url: `${prefix}/logout`,
        method: 'POST',
      });
    }
    return request({
      url: '/member/auth/logout',
      method: 'POST',
    });
  },
  refreshToken: (refreshToken) => {
    if (isSaleorBff) {
      return request({
        url: `${prefix}/refresh-token`,
        method: 'POST',
        params: { refreshToken },
        custom: { showLoading: false, showError: false },
      });
    }
    return request({
      url: '/member/auth/refresh-token',
      method: 'POST',
      params: { refreshToken },
      custom: { showLoading: false, showError: false },
    });
  },
  socialAuthRedirect: (type, redirectUri) => {
    return request({
      url: '/member/auth/social-auth-redirect',
      method: 'GET',
      params: { type, redirectUri },
      custom: { showSuccess: true, loadingMsg: '登录中' },
    });
  },
  socialLogin: (type, code, state) => {
    return request({
      url: '/member/auth/social-login',
      method: 'POST',
      data: { type, code, state },
      custom: { showSuccess: true, loadingMsg: '登录中' },
    });
  },
  weixinMiniAppLogin: (phoneCode, loginCode, state) => {
    return request({
      url: '/member/auth/weixin-mini-app-login',
      method: 'POST',
      data: { phoneCode, loginCode, state },
      custom: { showSuccess: true, loadingMsg: '登录中', successMsg: '登录成功' },
    });
  },
  createWeixinMpJsapiSignature: (url) => {
    return request({
      url: '/member/auth/create-weixin-jsapi-signature',
      method: 'POST',
      params: { url },
      custom: { showError: false, showLoading: false },
    });
  },
};

export default AuthUtil;
