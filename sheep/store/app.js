import DiyApi from '@/sheep/api/promotion/diy';
import HomeApi from '@/sheep/api/promotion/home';
import CategoryApi from '@/sheep/api/product/category';
import { getTenantByWebsite } from '@/sheep/api/infra/tenant';
import { getTenantId } from '@/sheep/request';
import { isSaleorBff } from '@/sheep/helper/saleor';
import { applyHomeMenuCategories } from '@/sheep/helper/home-menu-categories';
import { applyHomeBanners, applyHomeNotices } from '@/sheep/helper/home-content';
import { getMockDiyTemplate } from '@/sheep/mock/diy-template';
import { defineStore } from 'pinia';
import $platform from '@/sheep/platform';
import $router from '@/sheep/router';
import user from './user';
import sys from './sys';
import { baseUrl, h5Url } from '@/sheep/config';

const app = defineStore('app', {
  state: () => ({
    paramsForTabbar: {}, // 为全局tabbar跳转传参用。原因是 tabbar 无法传参，只能通过全局状态传递
    categoryActiveId: '', // 分类 Tab 上次选中的一级分类 id（slug）
    info: {
      // 应用信息
      name: '', // 商城名称
      logo: '', // logo
      version: '', // 版本号
      copyright: '', // 版权信息 I
      copytime: '', // 版权信息 II

      cdnurl: '', // 云存储域名
      filesystem: '', // 云存储平台
    },
    platform: {
      share: {
        methods: [], // 支持的分享方式
        forwardInfo: {}, // 默认转发信息
        posterInfo: {}, // 海报信息
        linkAddress: '', // 复制链接地址
      },
      bind_mobile: 0, // 登陆后绑定手机号提醒 (弱提醒，可手动关闭)
    },
    template: {
      // 店铺装修模板
      basic: {}, // 基本信息
      home: {
        // 首页模板
        style: {},
        data: [],
      },
      user: {
        // 个人中心模板
        style: {},
        data: [],
      },
    },
    homeLoading: false,
    userLoading: false,
    shareInfo: {}, // 全局分享信息
    has_wechat_trade_managed: 0, // 小程序发货信息管理  0 没有 || 1 有
  }),
  actions: {
    // 获取Shopro应用配置和模板
    async init(templateId = null) {
      this.homeLoading = true;
      this.userLoading = true;
      try {
        // 检查网络
        const networkStatus = await $platform.checkNetwork();
        if (!networkStatus) {
          $router.error('NetworkError');
        }

        // 检查配置
        if (typeof baseUrl === 'undefined') {
          $router.error('EnvError');
        }

        // 加载租户
        await adaptTenant();

        // 加载装修配置
        const cachedRevision = uni.getStorageSync('diy-template-revision');
        await adaptTemplate(this.template, templateId);
        if (isSaleorBff && cachedRevision !== DIY_TEMPLATE_REVISION) {
          // revision 变更时确保首页导航/搜索布局立即生效
          await adaptTemplate(this.template, templateId);
        }

        // TODO 芋艿：【初始化优化】未来支持管理后台可配；对应 https://api.shopro.sheepjs.com/shop/api/init
        if (true) {
          this.info = {
            name: '芋道商城',
            logo: 'https://static.iocoder.cn/ruoyi-vue-pro-logo.png',
            version: '2026.04',
            copyright: '全部开源，个人与企业可 100% 免费使用',
            copytime: 'Copyright© 2018-2025',

            cdnurl: 'https://file.sheepjs.com', // 云存储域名
            filesystem: 'qcloud', // 云存储平台
          };
          this.platform = {
            share: {
              methods: ['forward', 'poster', 'link'],
              linkAddress: h5Url,
              posterInfo: {
                user_bg: '/static/img/shop/config/user-poster-bg.png',
                goods_bg: '/static/img/shop/config/goods-poster-bg.png',
                groupon_bg: '/static/img/shop/config/groupon-poster-bg.png',
              },
              forwardInfo: {
                title: '',
                image: '',
                desc: '',
              },
            },
            bind_mobile: 0,
          };
          this.has_wechat_trade_managed = 0;

          // 加载主题
          const sysStore = sys();
          sysStore.setTheme();

          // 模拟用户登录
          const userStore = user();
          if (userStore.isLogin) {
            userStore.loginAfter();
          }
          return Promise.resolve(true);
        } else {
          $router.error('InitError', res.msg || '加载失败');
        }
      } finally {
        this.homeLoading = false;
        this.userLoading = false;
      }
    },
    /** 首页下拉刷新：只重载装修模板，避免重复走租户/登录链路 */
    async refreshHome() {
      this.homeLoading = true;
      try {
        await adaptTemplate(this.template, null);
      } finally {
        this.homeLoading = false;
      }
    },
    /** 个人中心下拉刷新：重载 user 装修模板 */
    async refreshUser() {
      this.userLoading = true;
      try {
        await adaptTemplate(this.template, null);
      } finally {
        this.userLoading = false;
      }
    },
    // 设置 paramsForTabbar
    setParamsForTabbar(params = {}) {
      this.paramsForTabbar = params;
    },
    clearParamsForTabbar() {
      this.paramsForTabbar = {};
    },
    setCategoryActiveId(id = '') {
      this.categoryActiveId = id ? String(id) : '';
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'app-store',
      },
    ],
  },
});

/** 本地开发：跳过按域名解析租户（localhost 等在库里通常未配置） */
const isLocalDevHost = () => {
  // #ifdef H5
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host.startsWith('10.')
    );
  }
  // #endif
  return import.meta.env.SHOPRO_SKIP_TENANT_LOOKUP === '1';
};

/** 初始化租户编号 */
const adaptTenant = async () => {
  if (isSaleorBff || isLocalDevHost()) {
    return;
  }
  // 1. 获取当前租户 ID
  const oldTenantId = getTenantId();
  let newTenantId = null;

  try {
    // 2.1 情况一：H5：根据 url 参数、域名来获取新的租户ID
    // #ifdef H5
    // H5 环境下的处理逻辑
    if (window?.location) {
      // 优先从 URL 查询参数获取 tenantId
      const urlParams = new URLSearchParams(window.location.search);
      newTenantId = urlParams.get('tenantId');

      // 如果 URL 参数中没有，则通过 host 获取
      if (!newTenantId && window.location.host) {
        const { data } = await getTenantByWebsite(window.location.host);
        newTenantId = data?.id;
      }
    }
    // #endif

    // 2.2 情况二：微信小程序：小程序环境下的处理逻辑 - 根据 appId 获取租户
    // #ifdef MP
    const appId = uni.getAccountInfoSync()?.miniProgram?.appId;
    if (appId) {
      const { data } = await getTenantByWebsite(appId);
      newTenantId = data?.id;
    }
    // #endif

    // 3. 如果是新租户（不相等），则进行切换
    // noinspection EqualityComparisonWithCoercionJS
    if (newTenantId && newTenantId != oldTenantId) {
      // 清理掉登录用户的 token
      const userStore = user();
      userStore.setToken();

      // 设置新的 tenantId 到本地存储
      uni.setStorageSync('tenant-id', newTenantId);
      console.log('租户 ID 已更新:', `${oldTenantId} -> ${newTenantId}`);
    }
  } catch (error) {
    console.error('adaptTenant 执行失败:', error);
  }
};

/** 装修模板版本：变更后强制重载，避免 pinia 缓存旧首页布局 */
const DIY_TEMPLATE_REVISION = 15;

/** Saleor：用后台分类替换首页金刚区静态 mock */
const hydrateHomeMenuFromSaleor = async (diyTemplate) => {
  try {
    const res = await CategoryApi.getCategoryList();
    if (res?.code !== 0 || !Array.isArray(res.data) || !res.data.length) {
      return;
    }
    const menuComp = diyTemplate?.home?.components?.find((c) => c.id === 'MenuSwiper');
    const max = (menuComp?.property?.row || 2) * (menuComp?.property?.column || 5);
    applyHomeMenuCategories(diyTemplate.home, res.data, max);
  } catch (error) {
    console.warn('[p1-mall-uniapp] home menu categories failed, using mock:', error);
  }
};

/** Saleor：Collection/Page 替换首页轮播与公告 */
const hydrateHomeContentFromSaleor = async (diyTemplate) => {
  try {
    const res = await HomeApi.getHomeContent();
    if (res?.code !== 0 || !res.data) {
      return;
    }
    applyHomeBanners(diyTemplate.home, res.data.banners);
    applyHomeNotices(diyTemplate.home, res.data.notices);
  } catch (error) {
    console.warn('[p1-mall-uniapp] home content failed, using mock:', error);
  }
};

/** 初始化装修模版 */
const parseDiyPayload = (data) => {
  if (!data) return null;
  const parse = (value, fallback = {}) => {
    if (value == null || value === '') return fallback;
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  };
  return {
    id: data.id,
    name: data.name,
    property: parse(data.property, {}),
    home: parse(data.home, {}),
    user: parse(data.user, {}),
  };
};

const applyDiyTemplate = async (appTemplate, diyTemplate) => {
  const tabBar = diyTemplate?.property?.tabBar;
  if (tabBar) {
    appTemplate.basic.tabbar = tabBar;
    if (tabBar?.theme) {
      appTemplate.basic.theme = tabBar?.theme;
    }
  }
  // Saleor 原生：分类 / 系列轮播 / 公告 覆盖装修模板里的对应组件内容
  await hydrateHomeMenuFromSaleor(diyTemplate);
  await hydrateHomeContentFromSaleor(diyTemplate);
  appTemplate.home = diyTemplate?.home;
  appTemplate.user = diyTemplate?.user;
  uni.setStorageSync('diy-template-revision', DIY_TEMPLATE_REVISION);
};

/** 初始化装修模版 */
const adaptTemplate = async (appTemplate, templateId) => {
  if (isSaleorBff) {
    let diyTemplate = null;
    try {
      const res = templateId
        ? await DiyApi.getDiyTemplate(templateId)
        : await DiyApi.getUsedDiyTemplate();
      if (res?.code === 0 && res.data) {
        diyTemplate = parseDiyPayload(res.data);
      }
    } catch (error) {
      console.warn('[p1-mall-uniapp] DIY template API failed, using local mock:', error);
    }
    if (!diyTemplate) {
      diyTemplate = getMockDiyTemplate();
    }
    await applyDiyTemplate(appTemplate, diyTemplate);
    return;
  }
  let diyTemplate = null;
  try {
    const res = templateId
      ? await DiyApi.getDiyTemplate(templateId)
      : await DiyApi.getUsedDiyTemplate();
    if (res && res.code === 0 && res.data) {
      diyTemplate = res.data;
    }
  } catch (error) {
    console.warn('[p1-mall-uniapp] DIY template API failed, using local mock:', error);
  }
  if (!diyTemplate) {
    console.warn('[p1-mall-uniapp] Using mock DIY template (demo API unreachable or empty).');
    diyTemplate = getMockDiyTemplate();
  }

  const tabBar = diyTemplate?.property?.tabBar;
  if (tabBar) {
    appTemplate.basic.tabbar = tabBar;
    // TODO 商城装修没有对 tabBar 进行角标配置，测试角标需打开以下注释
    // appTemplate.basic.tabbar.items.forEach((tabBar) => {
    //   tabBar.dot = false
    //   tabBar.badge = 100
    // })
    // appTemplate.basic.tabbar.badgeStyle = {
    //   backgroundColor: '#882222',
    // }
    if (tabBar?.theme) {
      appTemplate.basic.theme = tabBar?.theme;
    }
  }
  appTemplate.home = diyTemplate?.home;
  appTemplate.user = diyTemplate?.user;
};

export default app;
