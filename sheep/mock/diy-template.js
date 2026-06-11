/** 本地 fallback：芋道演示 API 不可达时仍能展示首页骨架 */

const tabBar = {
  mode: 1,
  style: {
    bgType: 'color',
    bgColor: '#ffffff',
    color: '#999999',
    activeColor: '#e93323',
  },
  badgeStyle: {},
  items: [
    {
      text: '首页',
      url: '/pages/index/index',
      iconUrl: 'http://test.yudao.iocoder.cn/static/img/shop/tabbar/home.png',
      activeIconUrl: 'http://test.yudao.iocoder.cn/static/img/shop/tabbar/home-active.png',
    },
    {
      text: '分类',
      url: '/pages/index/category',
      iconUrl: 'http://test.yudao.iocoder.cn/static/img/shop/tabbar/category.png',
      activeIconUrl: 'http://test.yudao.iocoder.cn/static/img/shop/tabbar/category-active.png',
    },
    {
      text: '购物车',
      url: '/pages/index/cart',
      iconUrl: 'http://test.yudao.iocoder.cn/static/img/shop/tabbar/cart.png',
      activeIconUrl: 'http://test.yudao.iocoder.cn/static/img/shop/tabbar/cart-active.png',
    },
    {
      text: '我的',
      url: '/pages/index/user',
      iconUrl: 'http://test.yudao.iocoder.cn/static/img/shop/tabbar/user.png',
      activeIconUrl: 'http://test.yudao.iocoder.cn/static/img/shop/tabbar/user-active.png',
    },
  ],
};

const userPageStyle = {
  bgType: 'color',
  bgColor: '#ffffff',
  marginLeft: 12,
  marginRight: 12,
  marginTop: 0,
  marginBottom: 8,
  borderRadius: 8,
};

const staticBase = 'http://test.yudao.iocoder.cn/static/img/shop';
const diyBase = 'http://test.yudao.iocoder.cn/static/img/diy';

const menuBadge = { show: false, textColor: '#fff', bgColor: '#FF6000' };

/** 芋道个人中心 MenuGrid 菜单项（与默认装修模板一致） */
function diyMenuItem(title, url, iconFile) {
  return {
    title,
    titleColor: '#333',
    subtitle: '',
    subtitleColor: '#bbb',
    badge: menuBadge,
    iconUrl: `${diyBase}/${iconFile}`,
    url,
  };
}

const userCenterMenuGrid = [
  diyMenuItem('签到', '/pages/app/sign', 'sign.png'),
  diyMenuItem('充值', '/pages/pay/recharge', 'recharge.png'),
  diyMenuItem('提现', '/pages/commission/withdraw', 'withdraw.png'),
  diyMenuItem('设置', '/pages/public/setting', 'setting.png'),
  diyMenuItem('收藏', '/pages/user/goods-collect', 'goods-collect.png'),
  diyMenuItem('浏览足迹', '/pages/user/goods-log', 'goods-log.png'),
  diyMenuItem('意见反馈', '/pages/public/richtext?title=意见反馈', 'feedback.png'),
  diyMenuItem('分销中心', '/pages/commission/index', 'commission.png'),
  diyMenuItem('拼团订单', '/pages/activity/groupon/order', 'groupon.png'),
  diyMenuItem('常见问题', '/pages/public/richtext?title=常见问题', 'faq.png'),
  diyMenuItem('积分商城', '/pages/activity/point/list', 'point.png'),
  diyMenuItem('关于我们', '/pages/public/richtext?title=关于我们', 'about-us.png'),
  diyMenuItem('隐私协议', '/pages/public/richtext?title=隐私协议', 'privacy.png'),
  diyMenuItem('收货地址', '/pages/user/address/list', 'address.png'),
  diyMenuItem('发票管理', '/pages/public/richtext?title=发票管理', 'invoice.png'),
  diyMenuItem('联系客服', '/pages/chat/index', 'chat-index.png'),
];

export function getMockDiyTemplate() {
  return {
    property: { tabBar },
    home: {
      style: { backgroundColor: '#f6f6f6', marginLeft: 0, marginRight: 0, marginTop: 0, marginBottom: 0 },
      components: [
        {
          id: 'SearchBar',
          property: {
            style: { marginTop: 8, marginBottom: 8, marginLeft: 12, marginRight: 12 },
            placeholder: '搜索商品',
            borderRadius: 20,
            placeholderPosition: 'left',
            elBackground: '#ffffff',
            fontColor: '#999999',
            height: 36,
          },
        },
        {
          id: 'NoticeBar',
          property: {
            style: { marginBottom: 8 },
            iconUrl: 'http://test.yudao.iocoder.cn/static/img/shop/notice.png',
            textColor: '#fa8c16',
            contents: [
              {
                text: 'Saleor 商城 — 底部 Tab 可切换首页/分类/购物车/我的。',
                url: '/pages/goods/list',
              },
            ],
          },
        },
        {
          id: 'MenuGrid',
          property: {
            style: { marginBottom: 8, marginLeft: 12, marginRight: 12, backgroundColor: '#ffffff', borderRadius: 8 },
            column: 4,
            space: 0,
            border: false,
            list: [
              { title: '商品列表', subtitle: '', titleColor: '#333', subtitleColor: '#999', iconUrl: 'http://test.yudao.iocoder.cn/static/img/shop/menu/goods.png', url: '/pages/goods/list', badge: { show: false } },
              { title: '商品分类', subtitle: '', titleColor: '#333', subtitleColor: '#999', iconUrl: 'http://test.yudao.iocoder.cn/static/img/shop/menu/category.png', url: '/pages/index/category', badge: { show: false } },
              { title: '购物车', subtitle: '', titleColor: '#333', subtitleColor: '#999', iconUrl: 'http://test.yudao.iocoder.cn/static/img/shop/menu/cart.png', url: '/pages/index/cart', badge: { show: false } },
              { title: '个人中心', subtitle: '', titleColor: '#333', subtitleColor: '#999', iconUrl: 'http://test.yudao.iocoder.cn/static/img/shop/menu/user.png', url: '/pages/index/user', badge: { show: false } },
            ],
          },
        },
        {
          id: 'TitleBar',
          property: {
            style: { marginLeft: 12, marginRight: 12, marginBottom: 8 },
            title: '推荐商品',
            subtitle: '来自 Saleor 商品库',
            titleColor: '#333333',
            subtitleColor: '#999999',
          },
        },
        {
          id: 'ProductCard',
          property: {
            layoutType: 'twoCol',
            spuIds: [],
            space: 8,
            borderRadiusTop: 8,
            borderRadiusBottom: 8,
            fields: {
              name: { show: true, color: '#333333' },
              introduction: { show: true, color: '#999999' },
              price: { show: true, color: '#e93323' },
              marketPrice: { show: true, color: '#999999' },
            },
            badge: { show: false },
            btnBuy: {
              type: 'text',
              text: '购买',
              bgBeginColor: '#ff6000',
              bgEndColor: '#fe832a',
            },
            style: { marginLeft: 12, marginRight: 12, marginBottom: 12 },
          },
        },
      ],
    },
    user: {
      page: {
        backgroundColor: '#f6f6f6',
      },
      navigationBar: {
        styleType: 'normal',
        alwaysShow: false,
        bgType: 'color',
        bgColor: '#fff',
      },
      style: { backgroundColor: '#f6f6f6' },
      components: [
        {
          id: 'UserCard',
          property: {
            style: {
              bgType: 'color',
              bgColor: 'linear-gradient(90deg, #ff6000, #fe832a)',
              marginBottom: 0,
            },
          },
        },
        {
          id: 'UserOrder',
          property: {
            space: 0,
            style: userPageStyle,
          },
        },
        {
          id: 'UserWallet',
          property: {
            space: 0,
            style: userPageStyle,
          },
        },
        {
          id: 'UserCoupon',
          property: {
            space: 0,
            style: userPageStyle,
          },
        },
        {
          id: 'MenuGrid',
          property: {
            column: 4,
            list: userCenterMenuGrid,
            style: {
              ...userPageStyle,
              marginBottom: 12,
            },
          },
        },
      ],
    },
  };
}
