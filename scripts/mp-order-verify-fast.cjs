/** Fast auto login (API token) → confirm page verify. Windows Node only. */
const automator = require('miniprogram-automator');
const cp = require('child_process');
const http = require('http');

const CLI = 'C:/Program Files (x86)/Tencent/微信web开发者工具/cli.bat';
const PROJECT = 'D:/flynn/saleor-org/mall-uniapp/dist/dev/mp-weixin';
const IDE_PORT = '43263';
const AUTO_PORT = process.env.MP_AUTO_PORT || '9421';
const WS = `ws://127.0.0.1:${AUTO_PORT}`;
const BFF = 'http://127.0.0.1:8010';
const MOBILE = '15711788779';
const SMS = '9999';
const VARIANT = 'UHJvZHVjdFZhcmlhbnQ6MzQ4';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => resolve(JSON.parse(raw)));
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function runCliAuto() {
  const cmd = `"${CLI}" auto --port ${IDE_PORT} --project "${PROJECT}" --auto-port ${AUTO_PORT} --trust-project`;
  return new Promise((resolve, reject) => {
    cp.exec(cmd, { cwd: 'C:/', shell: true }, (err, stdout, stderr) => {
      const out = String(stdout + stderr);
      if (err && !out.includes('auto')) reject(new Error(out || err.message));
      else resolve(out);
    });
  });
}

async function connectMp() {
  const end = Date.now() + 20000;
  while (Date.now() < end) {
    try {
      return await automator.connect({ wsEndpoint: WS });
    } catch {
      await sleep(500);
    }
  }
  throw new Error(`connect timeout ${WS}`);
}

async function withTimeout(promise, ms, label) {
  let timer;
  const t = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timeout ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, t]);
  } finally {
    clearTimeout(timer);
  }
}

async function uiSmsLogin(mp) {
  const page = await mp.currentPage();
  console.log('login page:', page.path);
  await sleep(1500);
  const radios = await page.$$('radio');
  if (radios.length) await radios[0].tap();
  const inputs = await page.$$('input');
  console.log('inputs:', inputs.length);
  if (inputs.length < 2) throw new Error('login inputs not found');
  await inputs[0].input(MOBILE);
  const btns = await page.$$('button');
  for (const btn of btns) {
    const t = await btn.text();
    if (String(t).includes('获取验证码')) {
      await btn.tap();
      break;
    }
  }
  await sleep(800);
  await inputs[1].input(SMS);
  for (const btn of btns) {
    const t = await btn.text();
    if (String(t).trim() === '登录') {
      await btn.tap();
      return;
    }
  }
  throw new Error('login button not found');
}

async function injectToken(mp, token, refreshToken) {
  await mp.evaluate(
    (t, rt) => {
      wx.setStorageSync('token', t);
      if (rt) wx.setStorageSync('refresh-token', rt);
    },
    token,
    refreshToken,
  );
}

async function main() {
  const login = await postJson(`${BFF}/mall/v1/auth/sms-login`, { mobile: MOBILE, code: SMS });
  if (login.code !== 0) throw new Error(`login api: ${JSON.stringify(login)}`);
  const token = login.data.accessToken;
  const refreshToken = login.data.refreshToken || '';
  console.log('OK login api');

  await runCliAuto();
  console.log('OK cli auto', AUTO_PORT);

  let mp = await connectMp();
  console.log('OK ws connected');

  try {
    await withTimeout(mp.reLaunch('/pages/index/index'), 10000, 'reLaunch');
    await sleep(1000);
    await injectToken(mp, token, refreshToken);
    console.log('OK relaunch + token');

    const confirmData = encodeURIComponent(
      JSON.stringify({ items: [{ skuId: VARIANT, count: 1 }] }),
    );
    try {
      await withTimeout(
        mp.navigateTo(`/pages/order/confirm?data=${confirmData}`),
        10000,
        'navigateTo',
      );
      console.log('OK navigate confirm');
    } catch (e) {
      console.log('navigateTo note:', e.message);
    }

    let page;
    for (let i = 0; i < 12; i++) {
      await sleep(1000);
      page = await mp.currentPage();
      console.log(`t+${i + 1}s route:`, page.path);
      if (page.path.includes('order/confirm')) break;
    }

    if (!page.path.includes('order/confirm')) {
      throw new Error(`never stayed on confirm, last=${page.path}`);
    }

    const footer = await page.$('.footer-box');
    const text = footer ? await footer.text() : '';
    console.log('footer:', String(text).slice(0, 120));

    if (String(text).includes('NaN') || String(text).includes('共0件')) {
      throw new Error(`bad footer: ${text}`);
    }
    if (!/\d+\.\d{2}/.test(String(text))) {
      throw new Error(`no price: ${text}`);
    }
    console.log('PASS logged-in confirm page');
  } finally {
    await mp.close().catch(() => {});
  }
}

main().catch((e) => {
  console.error('FAIL:', e.message || e);
  process.exit(1);
});
