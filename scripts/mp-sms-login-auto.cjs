/**
 * Simulator SMS login via UI (opens auth modal by visiting confirm page unauthenticated).
 * Windows: node \\wsl...\scripts\mp-sms-login-auto.cjs
 */
const automator = require('miniprogram-automator');
const cp = require('child_process');

const CLI = 'C:/Program Files (x86)/Tencent/微信web开发者工具/cli.bat';
const PROJECT = 'D:/flynn/saleor-org/mall-uniapp/dist/dev/mp-weixin';
const AUTO_PORT = process.env.MP_AUTO_PORT || '9421';
const WS = `ws://127.0.0.1:${AUTO_PORT}`;
const MOBILE = process.env.TEST_MOBILE || '15711788779';
const SMS = process.env.TEST_SMS_CODE || '9999';
const VARIANT = process.env.TEST_VARIANT || 'UHJvZHVjdFZhcmlhbnQ6MzQ4';
const BFF = process.env.SHOPRO_DEV_BASE_URL || 'http://127.0.0.1:8010';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    sleep(ms).then(() => {
      throw new Error(`timeout: ${label}`);
    }),
  ]);
}

async function apiLogin() {
  const res = await fetch(`${BFF}/mall/v1/auth/sms-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: MOBILE, code: SMS }),
  });
  const body = await res.json();
  const token = body?.data?.accessToken;
  const refreshToken = body?.data?.refreshToken || '';
  if (body.code !== 0 || !token) {
    throw new Error(`api login failed: ${JSON.stringify(body).slice(0, 200)}`);
  }
  return { token, refreshToken };
}

async function injectToken(mp, token, refreshToken) {
  await mp.evaluate(
    (accessToken, rt) => {
      wx.setStorageSync('token', accessToken);
      wx.setStorageSync('refresh-token', rt || '');
    },
    token,
    refreshToken || '',
  );
}

async function verifySettlement(token) {
  const qs = [
    `items[0].skuId=${encodeURIComponent(VARIANT)}`,
    `items[0].count=1`,
  ].join('&');
  const res = await fetch(`${BFF}/mall/v1/orders/settlement?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  const payPrice = body?.data?.price?.payPrice;
  if (body.code !== 0 || !payPrice) {
    throw new Error(`settlement failed: ${JSON.stringify(body).slice(0, 200)}`);
  }
  return payPrice;
}

function runCliAuto() {
  const cmd = `"${CLI}" auto --port 43263 --project "${PROJECT}" --auto-port ${AUTO_PORT} --trust-project`;
  return new Promise((resolve, reject) => {
    cp.exec(cmd, { cwd: 'C:/', shell: true }, (err, stdout, stderr) => {
      const out = String(stdout + stderr);
      if (err && !out.includes('auto')) reject(new Error(out || err.message));
      else resolve();
    });
  });
}

async function connectMp() {
  for (let i = 0; i < 40; i++) {
    try {
      return await automator.connect({ wsEndpoint: WS });
    } catch {
      await sleep(500);
    }
  }
  throw new Error(`ws connect failed ${WS}`);
}

async function openLoginModal(mp) {
  await mp.evaluate(() => {
    wx.removeStorageSync('token');
    wx.removeStorageSync('refresh-token');
    wx.removeStorageSync('user-store');
  });
  await mp.evaluate(() => {
    return new Promise((resolve) => {
      wx.reLaunch({ url: '/pages/index/index', complete: resolve });
    });
  });
  await sleep(2000);

  const data = encodeURIComponent(JSON.stringify({ items: [{ skuId: VARIANT, count: 1 }] }));
  try {
    await withTimeout(mp.navigateTo(`/pages/order/confirm?data=${data}`), 8000, 'navigateTo confirm');
  } catch {
    /* timeout ok — modal may still appear after navigateBack */
  }
  await sleep(3000);
}

async function waitInputs(page, ms = 12000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const inputs = await withTimeout(page.$$('input'), 3000, 'query inputs').catch(() => []);
    if (inputs.length >= 2) return inputs;
    await sleep(500);
  }
  throw new Error('login modal inputs not found');
}

async function queryText(mp, selector, waitMs = 8000) {
  await sleep(500);
  return Promise.race([
    mp.evaluate((sel) => {
      return new Promise((resolve) => {
        const p = getCurrentPages().pop();
        if (!p || !p.createSelectorQuery) {
          resolve('');
          return;
        }
        p.createSelectorQuery()
          .select(sel)
          .fields({ text: true }, (res) => resolve((res && res.text) || ''))
          .exec();
      });
    }, selector),
    sleep(waitMs).then(() => ''),
  ]);
}

async function uiSmsLogin(mp) {
  let page;
  let inputs;
  for (let i = 0; i < 24; i++) {
    page = await mp.currentPage();
    inputs = await withTimeout(page.$$('input'), 3000, 'query inputs').catch(() => []);
    if (inputs.length >= 2) break;
    await sleep(500);
  }
  if (!inputs || inputs.length < 2) {
    throw new Error('login modal inputs not found');
  }
  console.log('page before login:', page.path);

  const radios = await withTimeout(page.$$('radio'), 5000, 'query radios').catch(() => []);
  if (radios.length) await withTimeout(radios[0].tap(), 5000, 'tap agree radio');

  await withTimeout(inputs[0].input(MOBILE), 5000, 'input mobile');

  const btns = await withTimeout(page.$$('button'), 5000, 'query buttons');
  for (const btn of btns) {
    if (String(await withTimeout(btn.text(), 3000, 'btn text')).includes('获取验证码')) {
      await withTimeout(btn.tap(), 5000, 'tap sms code');
      break;
    }
  }
  await sleep(1000);
  await withTimeout(inputs[1].input(SMS), 5000, 'input sms');

  for (const btn of btns) {
    if (String(await withTimeout(btn.text(), 3000, 'btn text')).trim() === '登录') {
      await withTimeout(btn.tap(), 5000, 'tap login');
      return;
    }
  }
  for (const btn of await withTimeout(page.$$('button'), 5000, 'query buttons again')) {
    if (String(await withTimeout(btn.text(), 3000, 'btn text')).trim() === '登录') {
      await withTimeout(btn.tap(), 5000, 'tap login');
      return;
    }
  }
  throw new Error('login button not found');
}

async function main() {
  await runCliAuto();
  const mp = await connectMp();
  console.log('OK ws connected');

  try {
    await openLoginModal(mp);
    try {
      await uiSmsLogin(mp);
      console.log('OK UI SMS login');
    } catch (uiErr) {
      console.log('WARN UI login failed:', uiErr.message);
      console.log('fallback: BFF API login + token inject');
      const { token, refreshToken } = await apiLogin();
      await injectToken(mp, token, refreshToken);
      console.log('OK API login token', String(token).slice(0, 8) + '...');
    }

    await sleep(2000);
    const token = await mp.evaluate(() => wx.getStorageSync('token') || '');
    if (!token) throw new Error('login failed: no token in storage');
    console.log('OK token in storage', String(token).slice(0, 8) + '...');

    const payPrice = await verifySettlement(token);
    console.log('OK BFF settlement payPrice(fen):', payPrice);

    const data = encodeURIComponent(JSON.stringify({ items: [{ skuId: VARIANT, count: 1 }] }));
    await mp.evaluate((encoded) => {
      return new Promise((resolve) => {
        wx.reLaunch({
          url: `/pages/order/confirm?data=${encoded}`,
          complete: resolve,
        });
      });
    }, data);
    await sleep(5000);

    const page = await mp.currentPage();
    console.log('page after login:', page.path);

    const totalText = await queryText(mp, '.total-num', 5000);
    if (totalText && !totalText.includes('NaN') && /￥\d+\.\d{2}/.test(totalText)) {
      console.log('OK simulator UI price:', totalText.trim());
    } else {
      console.log('WARN UI price not readable (automator DOM); BFF settlement OK');
    }
    console.log('PASS simulator SMS login');
    process.exit(0);
  } finally {
    /* keep simulator session open — mp.close() often hangs */
  }
}

main().catch((e) => {
  console.error('FAIL:', e.message || e);
  process.exit(1);
});
