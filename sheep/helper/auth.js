import $store from '@/sheep/store';
import { showAuthModal } from '@/sheep/hooks/useModal';

/** 解析 uni 跳转 url 为 ROUTES_MAP 使用的 path */
function normalizeRoutePath(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }
  let path = url.split('?')[0].trim();
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  return path;
}

/** 该 path 是否在 pages.json 中标记为需要登录 */
export function isAuthRequiredPath(url) {
  const path = normalizeRoutePath(url);
  if (!path || typeof ROUTES_MAP === 'undefined') {
    return false;
  }
  return !!ROUTES_MAP[path]?.meta?.auth;
}

/** storage 有 token 时同步 Pinia isLogin（避免深链/热更新后状态不一致） */
export function syncLoginFromStorage() {
  return $store('user').syncLoginFromStorage();
}

/** 拦截 uni 原生跳转：需登录页且未登录则弹窗并取消导航 */
export function guardAuthNavigation(url) {
  if (!isAuthRequiredPath(url)) {
    return true;
  }
  syncLoginFromStorage();
  if ($store('user').isLogin) {
    return true;
  }
  showAuthModal();
  return false;
}

/** 页面 onLoad 使用：未登录则弹窗并返回上一页/首页 */
export function requirePageAuth() {
  syncLoginFromStorage();
  if ($store('user').isLogin) {
    return true;
  }
  showAuthModal();
  uni.navigateBack({
    fail: () => {
      uni.switchTab({ url: '/pages/index/index' });
    },
  });
  return false;
}

/** 注册 navigateTo / redirectTo / reLaunch 全局鉴权（弥补绕过 $router.go 的跳转） */
export function installRouteAuthInterceptor() {
  ['navigateTo', 'redirectTo', 'reLaunch'].forEach((api) => {
    uni.addInterceptor(api, {
      invoke(args) {
        if (!guardAuthNavigation(args?.url)) {
          return false;
        }
      },
    });
  });
}
