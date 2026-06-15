import $store from '@/sheep/store';
import { isSaleorBff } from '@/sheep/helper/saleor';

function trimTrailingSlash(url) {
  return String(url || '').replace(/\/+$/, '');
}

export function isVoceChatConfigured() {
  return Boolean(trimTrailingSlash(import.meta.env.SHOPRO_VOCECHAT_BASE_URL));
}

export function getVoceChatOrigin() {
  try {
    return new URL(trimTrailingSlash(import.meta.env.SHOPRO_VOCECHAT_BASE_URL)).origin;
  } catch {
    return '';
  }
}

export function isCustomerServiceRoute(page) {
  return String(page || '').split('?')[0] === '/pages/chat/index';
}

export function getVoceChatWelcomeLines(context = {}) {
  return buildWelcomeMessage(context)
    .split(/<br\s*\/?>/i)
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildWelcomeMessage(context = {}) {
  const custom = import.meta.env.SHOPRO_VOCECHAT_WELCOME;
  if (custom) {
    return custom;
  }
  const parts = ['您好，有什么可以帮您？'];
  if (context.productName) {
    parts.push(`咨询商品：${context.productName}`);
  }
  if (context.productId) {
    parts.push(`商品ID：${context.productId}`);
  }
  if (context.orderNo) {
    parts.push(`订单号：${context.orderNo}`);
  }
  return parts.join('<br/>');
}

/** 商城顾客在 VoceChat 的唯一标识（手机号优先，便于与测试账号 15711788779 对齐） */
export function getWidgetUserId() {
  const user = $store('user').userInfo || {};
  if (user.mobile) {
    return String(user.mobile);
  }
  if (user.id) {
    return String(user.id);
  }
  return '';
}

function openContactFallback() {
  const page =
    import.meta.env.SHOPRO_VOCECHAT_CONTACT_PAGE || '/pages/public/richtext?title=联系客服';
  uni.navigateTo({
    url: page,
    fail: () => {
      uni.showToast({ title: '暂未配置客服', icon: 'none' });
    },
  });
}

/** VoceChat embed 内建顶栏/输入栏/底栏高度（外层裁掉，用商城原生输入框） */
export const VOCECHAT_HEADER_PX = 56;
export const VOCECHAT_INPUT_PX = 80;
export const VOCECHAT_FOOTER_PX = 32;
export const VOCECHAT_BOTTOM_CLIP_PX = VOCECHAT_INPUT_PX + VOCECHAT_FOOTER_PX;
/** 商城底部原生输入栏占位（px） */
export const VOCECHAT_NATIVE_INPUT_PX = 96;

/** H5 同域代理时用当前页面 origin，避免 localhost / 127.0.0.1 混用导致 iframe 跨域 */
export function getVoceChatEmbedBase() {
  const configured = trimTrailingSlash(import.meta.env.SHOPRO_VOCECHAT_BASE_URL);
  // #ifdef H5
  if (typeof window !== 'undefined' && configured.includes('/vocechat')) {
    return `${window.location.origin}/vocechat`;
  }
  // #endif
  return configured;
}

/** H5 客服页 iframe URL（芋道式：外层的 s-layout 顶栏 + 内嵌会话区） */
export function buildVoceChatEmbedUrl(context = {}) {
  const baseUrl = getVoceChatEmbedBase();
  const openWidth = Math.floor(
    context.openWidth ??
      (typeof window !== 'undefined' ? window.innerWidth : 390),
  );
  const contentHeight = Math.floor(
    context.openHeight ??
      (typeof window !== 'undefined'
        ? Math.max(window.innerHeight - 88, 480)
        : 680),
  );
  // iframe 内多加载顶栏+底栏像素，外层 overflow:hidden 裁掉
  const openHeight = contentHeight + VOCECHAT_HEADER_PX + VOCECHAT_BOTTOM_CLIP_PX;

  const autoReg =
    context.autoReg ?? import.meta.env.SHOPRO_VOCECHAT_AUTO_REG ?? 'false';

  const params = new URLSearchParams({
    host: String(import.meta.env.SHOPRO_VOCECHAT_HOST_ID || '1'),
    autoReg: String(autoReg),
    themeColor: import.meta.env.SHOPRO_VOCECHAT_THEME_COLOR || '#e93323',
    title: '',
    welcome: buildWelcomeMessage(context),
    showPopup: 'false',
    popupTitle: '',
    popupSubtitle: '',
    embed: 'true',
    open: String(Date.now()),
    openWidth: String(openWidth),
    openHeight: String(openHeight),
    isMobile: 'true',
  });

  const userId = getWidgetUserId();
  if (userId) {
    params.set('id', userId);
  }

  return `${baseUrl}/widget.html?${params.toString()}`;
}

export function shouldUseVoceChatPage() {
  // #ifdef H5
  return isSaleorBff && isVoceChatConfigured();
  // #endif
  // #ifndef H5
  return false;
  // #endif
}

function buildChatPageQuery(context = {}) {
  const query = {};
  if (context.productId) {
    query.id = context.productId;
  }
  if (context.productName) {
    query.productName = context.productName;
  }
  if (context.orderNo) {
    query.orderNo = context.orderNo;
  }
  return query;
}

/** 跳转芋道同款客服页（Saleor H5 内为 VoceChat 全屏会话） */
export function openCustomerService(context = {}) {
  if (shouldUseVoceChatPage()) {
    const query = buildChatPageQuery(context);
    const qs = Object.entries(query)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    uni.navigateTo({
      url: `/pages/chat/index${qs ? `?${qs}` : ''}`,
      fail: () => openContactFallback(),
    });
    return;
  }
  openContactFallback();
}

/**
 * Saleor：未配置 VoceChat 时拦截芋道 IM；已配置则走正常 navigateTo 客服页
 */
export function handleCustomerServiceRoute(params = {}) {
  if (!isSaleorBff) {
    return false;
  }
  if (shouldUseVoceChatPage()) {
    return false;
  }
  openContactFallback();
  return true;
}
