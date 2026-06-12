const cp = require('child_process');
const automator = require('miniprogram-automator');

const CLI = 'C:/Program Files (x86)/Tencent/微信web开发者工具/cli.bat';
const PROJECT = 'D:/flynn/saleor-org/mall-uniapp/dist/dev/mp-weixin';
const AUTO_PORT = 9425;
const args = ['auto', '--project', PROJECT, '--auto-port', String(AUTO_PORT), '--trust-project'];
const cmd = `"${CLI}" ${args.map((a) => `"${a}"`).join(' ')}`;

const p = cp.spawn(cmd, [], { stdio: 'ignore', cwd: 'D:/flynn/saleor-org/mall-uniapp', shell: true });
p.on('error', (e) => console.log('spawn error', e.message));
p.on('exit', (code) => console.log('cli exit', code));

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

waitConnect()
  .then(async (mp) => {
    const page = await mp.currentPage();
    console.log('OK route', page.path);
    await mp.close();
    process.exit(0);
  })
  .catch((e) => {
    console.error('FAIL', e.message);
    process.exit(1);
  });
