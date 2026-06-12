const automator = require('miniprogram-automator');
const ports = process.argv.slice(2).length ? process.argv.slice(2) : [32123, 46266, 46426, 9420, 9423, 9424, 9425];

(async () => {
  for (const port of ports) {
    const ws = `ws://127.0.0.1:${port}`;
    try {
      const mp = await automator.connect({ wsEndpoint: ws });
      const page = await mp.currentPage();
      console.log('OK', ws, 'route', page.path);
      await mp.close();
      return;
    } catch (e) {
      console.log('no', ws, e.message.split('\n')[0]);
    }
  }
  process.exit(1);
})();
