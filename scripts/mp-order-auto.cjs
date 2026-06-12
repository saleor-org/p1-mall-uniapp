/**
 * WeChat mini program order smoke (Windows Node + miniprogram-automator).
 *
 * Prereq:
 * - DevTools 已开「设置 → 安全 → 服务端口」
 * - BFF :8010、npm run dev:mp-weixin 在跑
 * - 在 Windows 终端执行（勿从 WSL 直接 node，UNC 路径会导致 spawn EINVAL）
 *
 * 用法:
 *   cd D:\flynn\saleor-org\mall-uniapp
 *   node scripts/mp-order-auto.cjs
 *
 * 若 DevTools 是用 UNC 手动导入的，脚本会先 close 再以 D: 路径开启自动化。
 */
const automator = require('miniprogram-automator');
const cp = require('child_process');
const http = require('http');

const BFF = process.env.BFF_BASE_URL || 'http://127.0.0.1:8010';
const MOBILE = process.env.TEST_MOBILE || '15711788779';
const SMS = process.env.TEST_SMS_CODE || '9999';
const PRODUCT_SLUG = process.env.PRODUCT_SLUG || 'ascii-tee';
const CLI =
  process.env.WECHAT_CLI ||
  'C:/Program Files (x86)/Tencent/微信web开发者工具/cli.bat';
const PROJECT =
  process.env.MP_PROJECT ||
  'D:/flynn/saleor-org/mall-uniapp/dist/dev/mp-weixin';
const IDE_PORT = Number(process.env.WECHAT_PORT || 43263);
const AUTO_PORT = Number(process.env.MP_AUTO_PORT || 9420);
const SUBMIT_ORDER = process.env.MP_SUBMIT_ORDER !== '0';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function request(method, url, data, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = data ? JSON.stringify(data) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method,
        headers: body
          ? { ...headers, 'Content-Length': Buffer.byteLength(body) }
          : headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            reject(new Error(raw));
          }
        });
      },
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

const getJson = (url, token) => request('GET', url, null, token);
const postJson = (url, data, token) => request('POST', url, data, token);

function runCli(args) {
  const cmd = `"${CLI}" ${args.map((a) => `"${a}"`).join(' ')}`;
  return new Promise((resolve, reject) => {
    cp.exec(cmd, { cwd: 'C:/', shell: true }, (err, stdout, stderr) => {
      if (err && !String(stdout + stderr).includes('auto')) {
        reject(new Error(stderr || stdout || err.message));
        return;
      }
      resolve(String(stdout + stderr));
    });
  });
}

async function ensureAddress(token) {
  let list = await getJson(`${BFF}/mall/v1/member/address/list`, token);
  if (list.code !== 0) throw new Error(`address list: ${JSON.stringify(list)}`);
  if (!list.data?.length) {
    const create = await postJson(
      `${BFF}/mall/v1/member/address/create`,
      {
        name: '自动化收件人',
        mobile: MOBILE,
        areaId: 110101,
        detailAddress: '自动化路 1 号',
        defaultStatus: true,
      },
      token,
    );
    if (create.code !== 0) throw new Error(`address create: ${JSON.stringify(create)}`);
    list = await getJson(`${BFF}/mall/v1/member/address/list`, token);
  }
  if (!list.data?.length) throw new Error('no address after create');
  return list.data[0];
}

async function connectMp() {
  await runCli([
    'close',
    '--port',
    String(IDE_PORT),
    '--project',
    PROJECT,
  ]).catch(() => {});

  await runCli([
    'auto',
    '--port',
    String(IDE_PORT),
    '--project',
    PROJECT,
    '--auto-port',
    String(AUTO_PORT),
    '--trust-project',
  ]);

  const end = Date.now() + 30000;
  while (Date.now() < end) {
    try {
      return await automator.connect({ wsEndpoint: `ws://127.0.0.1:${AUTO_PORT}` });
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`connect timeout ws://127.0.0.1:${AUTO_PORT}`);
}

async function main() {
  const login = await postJson(`${BFF}/mall/v1/auth/sms-login`, { mobile: MOBILE, code: SMS });
  if (login.code !== 0) throw new Error(`login failed: ${JSON.stringify(login)}`);
  const token = login.data.accessToken;
  const refreshToken = login.data.refreshToken || '';
  console.log('OK login', MOBILE);

  await ensureAddress(token);
  console.log('OK address ready');

  const detail = await getJson(`${BFF}/mall/v1/products/${encodeURIComponent(PRODUCT_SLUG)}`);
  const variantId = detail.data?.variants?.[0]?.id;
  if (!variantId) throw new Error('no variant');
  console.log('OK product', PRODUCT_SLUG, 'variant', variantId);

  const settleQs = new URLSearchParams({
    'items[0].skuId': variantId,
    'items[0].count': '1',
    deliveryType: '1',
  });
  const settle = await getJson(`${BFF}/mall/v1/orders/settlement?${settleQs}`, token);
  if (settle.code !== 0 || !(settle.data?.price?.payPrice > 0)) {
    throw new Error(`settlement failed: ${JSON.stringify(settle)}`);
  }
  console.log('OK settlement payPrice=', settle.data.price.payPrice);

  const confirmData = encodeURIComponent(
    JSON.stringify({ items: [{ skuId: variantId, count: 1 }] }),
  );

  console.log('connecting DevTools automation...');
  const mp = await connectMp();

  try {
    // 写入 token 后 reLaunch 触发 App onLaunch/onShow，与 Pinia isLogin 对齐
    await mp.evaluate(
      (t, rt) => {
        wx.setStorageSync('token', t);
        if (rt) {
          wx.setStorageSync('refresh-token', rt);
        }
      },
      token,
      refreshToken,
    );

    await mp.reLaunch('/pages/index/index');
    await sleep(2500);

    await mp.navigateTo(`/pages/order/confirm?data=${confirmData}`);
    await sleep(6000);

    const page = await mp.currentPage();
    const route = page.path;
    console.log('route:', route);

    if (!route.includes('order/confirm')) {
      throw new Error(`not on confirm page (auth blocked?): ${route}`);
    }

    const snapshot = await page.$('page').then((el) => (el ? el.text() : '')).catch(() => '');
    const bodyText = String(snapshot);
    if (bodyText.includes('NaN') || bodyText.includes('共0件')) {
      throw new Error(`bad confirm content: ${bodyText.slice(0, 400)}`);
    }
    if (!/\d+\.\d{2}/.test(bodyText)) {
      throw new Error(`confirm page missing price: ${bodyText.slice(0, 400)}`);
    }
    console.log('PASS confirm page with valid settlement');

    if (!SUBMIT_ORDER) return;

    const submit = await page.$('.submit-btn');
    if (!submit) throw new Error('submit button not found');
    await submit.tap();
    await sleep(5000);

    const after = await mp.currentPage();
    const afterRoute = after.path;
    console.log('after submit route:', afterRoute);

    if (afterRoute.includes('pay/index') || afterRoute.includes('order/detail')) {
      console.log('PASS order submitted, navigated to', afterRoute);
      return;
    }

    const afterText = await after.$('page').then((el) => (el ? el.text() : '')).catch(() => '');
    if (String(afterText).includes('请选择收货地址')) {
      throw new Error('submit blocked: no address selected in UI');
    }
    throw new Error(`unexpected page after submit: ${afterRoute} ${String(afterText).slice(0, 200)}`);
  } finally {
    await mp.close();
  }
}

main().catch((e) => {
  console.error('FAIL:', e.message || e);
  process.exit(1);
});
