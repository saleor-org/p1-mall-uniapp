const cp = require('child_process');
const automator = require('miniprogram-automator');

const CLI = 'C:/Program Files (x86)/Tencent/微信web开发者工具/cli.bat';
const PROJECT = 'D:/flynn/saleor-org/mall-uniapp/dist/dev/mp-weixin';
const AUTO_PORT = Number(process.env.MP_AUTO_PORT || 9420);
const IDE_PORT = Number(process.env.WECHAT_PORT || 43263);

const args = [
  'auto',
  '--port', String(IDE_PORT),
  '--project', PROJECT,
  '--auto-port', String(AUTO_PORT),
  '--trust-project',
];
const cmd = `"${CLI}" ${args.map((a) => `"${a}"`).join(' ')}`;
console.log('run:', cmd);

const p = cp.spawn(cmd, [], { stdio: 'inherit', cwd: 'C:/', shell: true });

async function waitConnect(ms = 30000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      return await automator.connect({ wsEndpoint: `ws://127.0.0.1:${AUTO_PORT}` });
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error('connect timeout');
}

p.on('exit', async (code) => {
  console.log('cli exit', code);
  try {
    const mp = await waitConnect(5000);
    const page = await mp.currentPage();
    console.log('OK route', page.path);
    await mp.close();
    process.exit(0);
  } catch (e) {
    console.error('FAIL after cli exit', e.message);
    process.exit(1);
  }
});
