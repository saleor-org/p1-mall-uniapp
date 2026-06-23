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
      iconUrl: '/static/img/shop/tabbar/home.png',
      activeIconUrl: '/static/img/shop/tabbar/home-active.png',
    },
    {
      text: '分类',
      url: '/pages/index/category',
      iconUrl: '/static/img/shop/tabbar/category.png',
      activeIconUrl: '/static/img/shop/tabbar/category-active.png',
    },
    {
      text: '购物车',
      url: '/pages/index/cart',
      iconUrl: '/static/img/shop/tabbar/cart.png',
      activeIconUrl: '/static/img/shop/tabbar/cart-active.png',
    },
    {
      text: '我的',
      url: '/pages/index/user',
      iconUrl: '/static/img/shop/tabbar/user.png',
      activeIconUrl: '/static/img/shop/tabbar/user-active.png',
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

const diyBase = '/static/img/diy';
const menuSwiperBase = '/static/diy/menu-swiper';

const menuBadge = { show: false, textColor: '#fff', bgColor: '#FF6000' };

/** 芋道首页 MenuSwiper 金刚区（与演示站分类宫格一致：5 列 × 2 行） */
function menuSwiperItem(title, iconUrl, url = '/pages/index/category') {
  return {
    title,
    titleColor: '#333',
    iconUrl,
    url,
    badge: menuBadge,
  };
}

const homeMenuSwiperList = [
  menuSwiperItem('童装童鞋', `${menuSwiperBase}/01-tongzhuang.jpg`),
  menuSwiperItem('家用电器', `${menuSwiperBase}/02-jiadian.jpg`),
  menuSwiperItem('电子数码', `${menuSwiperBase}/03-shuma.jpg`),
  menuSwiperItem('美妆个护', `${menuSwiperBase}/04-meizhuang.png`),
  menuSwiperItem('母婴用品', `${menuSwiperBase}/05-muying.jpg`),
  menuSwiperItem('T 恤', `${menuSwiperBase}/06-txu.png`),
  menuSwiperItem('裙子', `${menuSwiperBase}/07-qunzi.png`),
  menuSwiperItem('汉服', `${menuSwiperBase}/08-hanfu.jpg`),
  menuSwiperItem('护肤套装', `${menuSwiperBase}/09-hufu.png`),
  menuSwiperItem('运动鞋', `${menuSwiperBase}/10-yundong.png`),
];

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
  diyMenuItem('发票管理', '/pages/user/invoice/list', 'invoice.png'),
  diyMenuItem('联系客服', '/pages/chat/index', 'chat-index.png'),
];

export function getMockDiyTemplate() {
  return {
    property: { tabBar },
    home: {
      page: {
        description: '',
        backgroundColor: '#f6f6f6',
        backgroundImage: '',
      },
      style: { backgroundColor: '#f6f6f6', marginLeft: 0, marginRight: 0, marginTop: 0, marginBottom: 0 },
      navigationBar: {
        styleType: 'normal',
        alwaysShow: true,
        bgType: 'color',
        bgColor: '#ffffff',
        otherCells: [],
      },
      components: [
        {
          id: 'Carousel',
          property: {
            type: 'default',
            indicator: 'dot',
            autoplay: true,
            interval: 3,
            height: 174,
            items: [
              {
                type: 'img',
                imgUrl: '/static/diy/icons/banner-01.jpg',
                videoUrl: '',
                url: '',
              },
              {
                type: 'img',
                imgUrl: '/static/diy/icons/banner-02.jpg',
                videoUrl: '',
                url: '',
              },
            ],
            style: { bgType: 'color', bgColor: '#fff', marginBottom: 0 },
          },
        },
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
          id: 'MenuSwiper',
          property: {
            layout: 'iconText',
            row: 2,
            column: 5,
            list: homeMenuSwiperList,
            style: {
              bgType: 'color',
              bgColor: '#ffffff',
              marginBottom: 8,
              marginLeft: 0,
              marginRight: 0,
            },
          },
        },
        {
          id: 'NoticeBar',
          property: {
            style: {
              marginBottom: 8,
              marginLeft: 0,
              marginRight: 0,
              bgType: 'color',
              bgColor: '#ffffff',
            },
            iconUrl: '',
            textColor: '#fa8c16',
            contents: [
              {
                text: '芋道商城演示 — 新人专享优惠券、限时秒杀，尽在首页。',
                url: '/pages/goods/list',
              },
            ],
          },
        },
        {
          id: 'TitleBar',
          property: {
            style: { marginLeft: 12, marginRight: 12, marginBottom: 8 },
            title: '热门推荐',
            subtitle: '精选好物',
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
        styleType: 'inner',
        alwaysShow: false,
        bgType: 'color',
        bgColor: 'transparent',
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
