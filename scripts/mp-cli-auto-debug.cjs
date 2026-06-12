const cp = require('child_process');
const CLI = 'C:/Program Files (x86)/Tencent/微信web开发者工具/cli.bat';
const PROJECT = 'D:/flynn/saleor-org/mall-uniapp/dist/dev/mp-weixin';
const args = ['auto', '--project', PROJECT, '--auto-port', '9423', '--trust-project'];

const cmd = `"${CLI}" ${args.map((a) => `"${a}"`).join(' ')}`;
console.log('run:', cmd);

const p = cp.spawn(cmd, [], {
  stdio: 'inherit',
  cwd: 'D:/flynn/saleor-org/mall-uniapp',
  shell: true,
});
p.on('error', (e) => console.log('spawn error', e.message));
p.on('exit', (code) => console.log('exit', code));
