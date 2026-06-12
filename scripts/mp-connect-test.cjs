const automator = require('miniprogram-automator');
const ws = process.argv[2] || 'ws://127.0.0.1:9420';

automator
  .connect({ wsEndpoint: ws })
  .then(async (mp) => {
    const page = await mp.currentPage();
    console.log('OK route', page.path);
    await mp.close();
  })
  .catch((e) => {
    console.error('FAIL', e.message);
    process.exit(1);
  });
