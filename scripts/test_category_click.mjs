import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:3000';

async function main() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: false,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const logs = [];
  page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`));

  await page.goto(`${BASE}/#/pages/index/category`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);

  // Left menu: click a category that might have jiuxin children
  const menuItems = page.locator('.menu-item');
  const menuCount = await menuItems.count();
  console.log('menu items:', menuCount);

  let productClicked = false;
  for (let i = 0; i < Math.min(menuCount, 30); i++) {
    await menuItems.nth(i).click({ force: true });
    await page.waitForTimeout(1500);

    const subTiles = page.locator('.goods-item');
    const subCount = await subTiles.count();
    if (subCount === 0) continue;

    console.log(`menu[${i}] subcategories:`, subCount);
    await subTiles.first().click({ force: true });
    await page.waitForTimeout(2500);

    const productCards = page.locator('.sm-goods-card');
    const prodCount = await productCards.count();
    console.log(`menu[${i}] products after sub tap:`, prodCount);
    if (prodCount === 0) continue;

    const beforeUrl = page.url();
    await productCards.first().click({ force: true });
    await page.waitForTimeout(2000);
    const afterUrl = page.url();
    console.log('before:', beforeUrl);
    console.log('after:', afterUrl);
    productClicked = true;
    break;
  }

  if (!productClicked) {
    console.log('FAIL: no product card found to click');
  } else if (!page.url().includes('/pages/goods/index')) {
    console.log('FAIL: URL did not navigate to goods detail');
  } else {
    console.log('OK: navigated to goods detail');
  }

  console.log('--- console ---');
  logs.slice(-20).forEach((l) => console.log(l));

  await page.waitForTimeout(5000);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
