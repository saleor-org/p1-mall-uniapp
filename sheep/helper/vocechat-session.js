/**
 * 商城顾客 ↔ VoceChat 会话：同一顾客重复进入走登录，不 autoReg 随机访客。
 * 依赖 H5 与 VoceChat 同域（/vocechat + /api 代理），localStorage 与 widget iframe 共享。
 */
import $store from '@/sheep/store';
import { getWidgetUserId } from '@/sheep/helper/customer-service';
import {
  formatOrderSummary,
  formatProductSummary,
  normalizeOrderForChat,
  normalizeProductForChat,
} from '@/sheep/helper/vocechat-cards';

const WIDGET_USER_PWD = '123123';
const KEY_LOGIN_USER = 'VOCECHAT_LOGIN_USER';
const KEY_TOKEN = 'VOCECHAT_TOKEN';
const KEY_EXPIRE = 'VOCECHAT_TOKEN_EXPIRE';
const KEY_REFRESH_TOKEN = 'VOCECHAT_REFRESH_TOKEN';
const KEY_UID = 'VOCECHAT_CURR_UID';
const KEY_DEVICE = 'VOCECHAT_DEVICE_KEY';
const KEY_BOUND_WIDGET = 'mall_vocechat_widget_id';

function getApiBase() {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  return '/api';
}

function getDeviceId() {
  let device = localStorage.getItem(KEY_DEVICE);
  if (!device) {
    device = `web:mall-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(KEY_DEVICE, device);
  }
  return device;
}

/** 当前商城顾客的 VoceChat 注册信息（手机号优先） */
export function getMallVoceChatProfile() {
  const user = $store('user').userInfo || {};
  const widgetId = getWidgetUserId();
  if (!widgetId) {
    return null;
  }
  const mobile = user.mobile ? String(user.mobile) : '';
  const tag = mobile || widgetId;
  return {
    widgetId,
    name: user.nickname || `顾客${tag}`,
    email: `${tag}@saleor.local`,
  };
}

function persistVoceChatAuth(data) {
  const { user, token, refresh_token, expired_in = 300 } = data || {};
  if (!user || !token) {
    throw new Error('VoceChat auth incomplete');
  }
  const expireTime = Date.now() + Number(expired_in) * 1000;
  localStorage.setItem(KEY_LOGIN_USER, JSON.stringify(user));
  localStorage.setItem(KEY_TOKEN, token);
  localStorage.setItem(KEY_REFRESH_TOKEN, refresh_token || '');
  localStorage.setItem(KEY_EXPIRE, String(expireTime));
  localStorage.setItem(KEY_UID, String(user.uid));
}

function hasValidSession(widgetId) {
  if (localStorage.getItem(KEY_BOUND_WIDGET) !== widgetId) {
    return false;
  }
  const token = localStorage.getItem(KEY_TOKEN);
  const expire = Number(localStorage.getItem(KEY_EXPIRE) || 0);
  return Boolean(token) && expire > Date.now() + 30_000;
}

async function voceFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!headers['Content-Type'] && options.body != null && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers,
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(body?.raw || body?.message || `VoceChat HTTP ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

async function loginWithPassword(email) {
  return voceFetch('/token/login', {
    method: 'POST',
    body: JSON.stringify({
      credential: { email, password: WIDGET_USER_PWD, type: 'password' },
      device: getDeviceId(),
      device_token: '',
    }),
  });
}

async function registerGuest(profile) {
  return voceFetch('/user/register', {
    method: 'POST',
    body: JSON.stringify({
      widget_id: profile.widgetId,
      name: profile.name,
      email: profile.email,
      password: WIDGET_USER_PWD,
      gender: 0,
      device: 'browser',
    }),
  });
}

/**
 * 为当前商城登录用户准备 VoceChat 会话（注册一次，之后密码登录）。
 * @returns {Promise<object>} AuthData
 */
export async function ensureVoceChatSession() {
  const profile = getMallVoceChatProfile();
  if (!profile) {
    throw new Error('请先登录商城账号后再联系客服');
  }
  if (hasValidSession(profile.widgetId)) {
    return { widgetId: profile.widgetId, cached: true };
  }

  let auth;
  try {
    auth = await registerGuest(profile);
  } catch (error) {
    if (error.status === 409) {
      auth = await loginWithPassword(profile.email);
    } else if (String(error.body?.raw || '').includes('License error')) {
      throw new Error('VoceChat 用户数已达上限，请在管理端清理测试账号或升级证书');
    } else {
      throw error;
    }
  }

  persistVoceChatAuth(auth);
  localStorage.setItem(KEY_BOUND_WIDGET, profile.widgetId);
  return auth;
}

export function getVoceChatToken() {
  return localStorage.getItem(KEY_TOKEN) || '';
}

/** 顾客 → 客服（host）发文本 */
export async function sendVoceChatMessage(content, properties = null) {
  const text = String(content || '').trim();
  if (!text) {
    throw new Error('消息不能为空');
  }
  let token = getVoceChatToken();
  if (!token) {
    await ensureVoceChatSession();
    token = getVoceChatToken();
  }
  if (!token) {
    throw new Error('VoceChat 未登录');
  }
  const hostId = Number(import.meta.env.SHOPRO_VOCECHAT_HOST_ID || 1);
  const headers = {
    'Content-Type': 'text/plain',
    'X-API-Key': token,
  };
  const encodedProps = encodeVoceProperties(properties);
  if (encodedProps) {
    headers['X-Properties'] = encodedProps;
  }
  const res = await fetch(`${getApiBase()}/user/${hostId}/send`, {
    method: 'POST',
    headers,
    body: text,
  });
  if (!res.ok) {
    const raw = await res.text();
    throw new Error(raw || `发送失败 (${res.status})`);
  }
  return res.json();
}

/** 发送商品/订单卡片（文本摘要 + X-Properties 存结构化数据） */
export async function sendVoceChatCard(type, rawData) {
  const mallType = type === 'goods' ? 'product' : type === 'order' ? 'order' : type;
  if (!['product', 'order'].includes(mallType)) {
    throw new Error('不支持的消息类型');
  }
  const mallData =
    mallType === 'product'
      ? normalizeProductForChat(rawData)
      : normalizeOrderForChat(rawData);
  const text =
    mallType === 'product' ? formatProductSummary(mallData) : formatOrderSummary(mallData);
  return sendVoceChatMessage(text, { mall_type: mallType, mall_data: mallData });
}

export function getVoceChatSelfUid() {
  return Number(localStorage.getItem(KEY_UID) || 0);
}

export function getVoceChatHostId() {
  return Number(import.meta.env.SHOPRO_VOCECHAT_HOST_ID || 1);
}

export function getVoceChatFileUrl(filePath, { thumbnail = false, download = false } = {}) {
  const path = String(filePath || '').trim();
  if (!path) {
    return '';
  }
  const params = new URLSearchParams({ file_path: path });
  if (thumbnail) {
    params.set('thumbnail', 'true');
  }
  if (download) {
    params.set('download', 'true');
  }
  return `${getApiBase()}/resource/file?${params.toString()}`;
}

function encodeVoceProperties(props) {
  if (!props || typeof props !== 'object') {
    return '';
  }
  const json = JSON.stringify(props);
  if (typeof btoa === 'function') {
    return btoa(unescape(encodeURIComponent(json)));
  }
  return '';
}

async function ensureVoceChatToken() {
  let token = getVoceChatToken();
  if (!token) {
    await ensureVoceChatSession();
    token = getVoceChatToken();
  }
  if (!token) {
    throw new Error('VoceChat 未登录');
  }
  return token;
}

async function blobFromTempPath(tempPath) {
  const res = await fetch(tempPath);
  if (!res.ok) {
    throw new Error('读取图片失败');
  }
  return res.blob();
}

function loadImageSizeFromUrl(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    img.onerror = () => resolve({});
    img.src = url;
  });
}

async function prepareVoceChatUpload(contentType, filename) {
  const token = await ensureVoceChatToken();
  const body = await voceFetch('/resource/file/prepare', {
    method: 'POST',
    headers: { 'X-API-Key': token },
    body: JSON.stringify({ content_type: contentType, filename }),
  });
  if (typeof body === 'string') {
    return body;
  }
  return body?.data ?? body?.file_id ?? body;
}

async function uploadVoceChatFileChunk(fileId, chunk, isLast) {
  const token = await ensureVoceChatToken();
  const formData = new FormData();
  formData.append('file_id', fileId);
  formData.append('chunk_data', chunk);
  formData.append('chunk_is_last', String(isLast));
  const res = await fetch(`${getApiBase()}/resource/file/upload`, {
    method: 'POST',
    headers: { 'X-API-Key': token },
    body: formData,
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    throw new Error(body?.raw || body?.message || `上传失败 (${res.status})`);
  }
  return body;
}

/** 从 uni chooseImage / s-uploader 的 temp path 上传到 VoceChat */
export async function uploadVoceChatImageFromPath(tempPath) {
  const blob = await blobFromTempPath(tempPath);
  const fileType = blob.type || 'image/jpeg';
  const ext = fileType.split('/')[1] || 'jpg';
  const filename = `mall-${Date.now()}.${ext}`;
  const fileId = await prepareVoceChatUpload(fileType, filename);
  if (!fileId) {
    throw new Error('准备上传失败');
  }
  return uploadVoceChatFileChunk(fileId, blob, true);
}

/** 上传并发送图片消息（content_type: vocechat/file） */
export async function sendVoceChatImage(tempPath) {
  const uploaded = await uploadVoceChatImageFromPath(tempPath);
  const path = uploaded?.path;
  if (!path) {
    throw new Error('上传图片失败');
  }
  const token = await ensureVoceChatToken();
  const hostId = getVoceChatHostId();
  const properties =
    uploaded?.image_properties || (await loadImageSizeFromUrl(tempPath));
  const res = await fetch(`${getApiBase()}/user/${hostId}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'vocechat/file',
      'X-API-Key': token,
      'X-Properties': encodeVoceProperties(properties),
    },
    body: JSON.stringify({ path }),
  });
  if (!res.ok) {
    const raw = await res.text();
    throw new Error(raw || `发送图片失败 (${res.status})`);
  }
  return res.json();
}

/** 拉取与客服 host 的 DM 历史 */
export async function fetchVoceChatHistory(limit = 100) {
  const token = getVoceChatToken();
  if (!token) {
    return [];
  }
  const hostId = getVoceChatHostId();
  const res = await fetch(`${getApiBase()}/user/${hostId}/history?limit=${limit}`, {
    headers: { 'X-API-Key': token },
  });
  if (!res.ok) {
    return [];
  }
  const rows = await res.json();
  const selfUid = getVoceChatSelfUid();
  return (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const contentType = String(row.detail?.content_type || '');
      const rawContent = row.detail?.content || '';
      const props = row.detail?.properties || {};
      const mallType = props.mall_type;
      const mallData = props.mall_data;
      const isImage = contentType === 'vocechat/file';
      const filePath = isImage ? String(rawContent) : '';

      if (mallType === 'product' && mallData) {
        return {
          id: row.mid,
          type: 'product',
          cardData: mallData,
          text: String(rawContent),
          isMine: Number(row.from_uid) === selfUid,
          createdAt: row.created_at || 0,
        };
      }
      if (mallType === 'order' && mallData) {
        return {
          id: row.mid,
          type: 'order',
          cardData: mallData,
          text: String(rawContent),
          isMine: Number(row.from_uid) === selfUid,
          createdAt: row.created_at || 0,
        };
      }

      return {
        id: row.mid,
        type: isImage ? 'image' : 'text',
        text: isImage ? '' : String(rawContent),
        imageUrl: isImage ? getVoceChatFileUrl(filePath, { thumbnail: true }) : '',
        imageFullUrl: isImage ? getVoceChatFileUrl(filePath) : '',
        isMine: Number(row.from_uid) === selfUid,
        createdAt: row.created_at || 0,
      };
    })
    .sort((a, b) => a.createdAt - b.createdAt);
}

let presenceEs = null;
let presenceAliveTimer = null;
let presenceReconnectTimer = null;
let presenceChatHandler = null;

async function renewVoceChatTokenIfNeeded() {
  const expire = Number(localStorage.getItem(KEY_EXPIRE) || 0);
  if (expire > Date.now() + 20_000) {
    return getVoceChatToken();
  }
  const token = getVoceChatToken();
  const refreshToken = localStorage.getItem(KEY_REFRESH_TOKEN) || '';
  if (!token || !refreshToken) {
    return token;
  }
  try {
    const auth = await voceFetch('/token/renew', {
      method: 'POST',
      body: JSON.stringify({ token, refresh_token: refreshToken }),
    });
    persistVoceChatAuth(auth);
    return auth.token;
  } catch (error) {
    console.warn('[VoceChat] token renew failed', error);
    return token;
  }
}

function resetPresenceAlive(timeout = 20_000) {
  if (presenceAliveTimer) {
    clearTimeout(presenceAliveTimer);
  }
  presenceAliveTimer = setTimeout(() => {
    stopVoceChatPresence();
    startVoceChatPresence(presenceChatHandler);
  }, timeout);
}

function isHostDmEvent(data, hostId, selfUid) {
  const fromUid = Number(data?.from_uid || 0);
  const targetUid = Number(data?.target?.uid || 0);
  return (
    fromUid === hostId ||
    fromUid === selfUid ||
    targetUid === hostId ||
    targetUid === selfUid
  );
}

/** 维持 SSE，管理端显示在线绿点；可选 onChat 回调实时刷新消息 */
export async function startVoceChatPresence(onChat) {
  if (typeof EventSource === 'undefined') {
    return;
  }
  presenceChatHandler = onChat || null;
  if (
    presenceEs &&
    (presenceEs.readyState === EventSource.OPEN || presenceEs.readyState === EventSource.CONNECTING)
  ) {
    return;
  }
  stopVoceChatPresence();

  let token = getVoceChatToken();
  if (!token) {
    await ensureVoceChatSession();
    token = await renewVoceChatTokenIfNeeded();
  } else {
    token = await renewVoceChatTokenIfNeeded();
  }
  if (!token) {
    return;
  }

  const params = new URLSearchParams({ limit: '500', 'api-key': token });
  const es = new EventSource(`${getApiBase()}/user/events?${params.toString()}`);
  presenceEs = es;
  const hostId = getVoceChatHostId();
  const selfUid = getVoceChatSelfUid();

  es.onopen = () => resetPresenceAlive();

  es.onmessage = (evt) => {
    try {
      const data = JSON.parse(evt.data);
      if (data.type === 'heartbeat') {
        resetPresenceAlive();
        return;
      }
      if (data.type === 'chat' && isHostDmEvent(data, hostId, selfUid) && presenceChatHandler) {
        presenceChatHandler(data);
      }
    } catch (error) {
      console.warn('[VoceChat] SSE message parse failed', error);
    }
  };

  es.onerror = () => {
    if (presenceEs !== es) {
      return;
    }
    es.close();
    presenceEs = null;
    if (presenceAliveTimer) {
      clearTimeout(presenceAliveTimer);
      presenceAliveTimer = null;
    }
    if (presenceReconnectTimer) {
      clearTimeout(presenceReconnectTimer);
    }
    presenceReconnectTimer = setTimeout(() => {
      startVoceChatPresence(presenceChatHandler);
    }, 2000);
  };
}

export function stopVoceChatPresence() {
  if (presenceAliveTimer) {
    clearTimeout(presenceAliveTimer);
    presenceAliveTimer = null;
  }
  if (presenceReconnectTimer) {
    clearTimeout(presenceReconnectTimer);
    presenceReconnectTimer = null;
  }
  if (presenceEs) {
    presenceEs.close();
    presenceEs = null;
  }
  presenceChatHandler = null;
}
