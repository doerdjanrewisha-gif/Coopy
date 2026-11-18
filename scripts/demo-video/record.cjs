// Records the Coopy demo video: the real app in a phone frame on a 1920x1080 stage.
const { chromium } = require('playwright');
const path = require('path');
const OUT = __dirname;
const APP = process.argv[2] || 'http://localhost:4173/';
const STAGE = 'http://localhost:4174/stage.html';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
  });
  // Tap ripple inside the app so viewers see each touch.
  await ctx.addInitScript(() => {
    if (location.port === '4174' || location.protocol === 'about:') return;
    const css = document.createElement('style');
    css.textContent = `.tap-dot{position:fixed;z-index:99999;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(226,0,26,.28);border:3px solid rgba(226,0,26,.75);pointer-events:none;animation:tapx .6s ease-out forwards}@keyframes tapx{0%{transform:scale(.4);opacity:1}100%{transform:scale(1.5);opacity:0}}
    *{scrollbar-width:none} ::-webkit-scrollbar{display:none}`;
    const add = () => document.head && document.head.appendChild(css);
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', add) : add();
    window.addEventListener('pointerdown', (e) => {
      const d = document.createElement('div');
      d.className = 'tap-dot';
      d.style.left = e.clientX + 'px';
      d.style.top = e.clientY + 'px';
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 700);
    }, true);
  });

  const page = await ctx.newPage();
  await page.goto(STAGE);
  await page.evaluate((u) => (document.getElementById('app').src = u + '#/home'), APP);
  await wait(1500);
  const f = page.frames().find((fr) => fr !== page.mainFrame() && fr.url().startsWith(APP));
  await f.waitForSelector('.dinner-card');
  const step = (n, cap, sub) => page.evaluate(([a, b, c]) => window.setStep(a, b, c), [n, cap, sub]);
  const scrollTo = (y) => f.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), y);
  const center = (sel) => f.locator(sel).first().evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  const tap = async (loc, pause = 700) => {
    await loc.scrollIntoViewIfNeeded();
    await wait(250);
    await loc.click();
    await wait(pause);
  };

  await wait(2600);
  await page.evaluate(() => window.hideIntro());

  // 1 — open
  await step(1, 'Open it from a QR code', 'No download and no sign-in. Coopy is a feature inside the Coop app, set to your store.');
  await wait(3200);
  await scrollTo(720);
  await wait(2200);
  await scrollTo(0);
  await wait(1400);

  // 2 — ask
  await step(2, 'Ask what’s for dinner', '“Dinner for two under 150 NOK in 20 minutes.” Coopy shows meals that really fit, priced in full packs.');
  await wait(1600);
  await tap(f.locator('.quick'), 400);
  await f.waitForSelector('.meal-card');
  await wait(1500);
  await center('.meal-list');
  await wait(3600);

  // 3 — refine
  await step(3, 'Refine in plain English', 'Tell Coopy what you already have at home. The totals drop straight away.');
  await wait(1200);
  const input = f.locator('.composer input');
  await input.click();
  await input.pressSequentially('I already have rice', { delay: 75 });
  await wait(400);
  await input.press('Enter');
  await wait(1600);
  await f.locator('.meal-list').last().evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  await wait(3400);

  // 4 — meal
  await step(4, 'Choose a meal', 'Recipe, steps, pack sizes, pack prices and the exact aisle for every ingredient.');
  await wait(900);
  await tap(f.locator('.meal-list').last().locator('.meal-card').first(), 300);
  await f.waitForSelector('.meal-main');
  await wait(2600);
  await scrollTo(380);
  await wait(2800);

  // 5 — have / swap
  await step(5, 'Already have it? Want a swap?', 'Tick off garlic, swap fresh spinach for frozen. Price and list update instantly.');
  await center('.ing:has-text("Garlic")');
  await wait(1300);
  await tap(f.locator('.ing', { hasText: 'Garlic' }).locator('.have-toggle'), 1800);
  await center('.ing:has-text("Baby spinach")');
  await wait(1100);
  await tap(f.locator('.ing', { hasText: 'Baby spinach' }).locator('.swap-btn'), 1800);
  await tap(f.locator('.swap-option', { hasText: 'frozen' }), 1500);
  await scrollTo(300);
  await wait(2400);

  // 6 — guide
  await step(6, 'Find ingredients in store', 'Your shopping list in walking order, with the route through this store.');
  await wait(1000);
  await tap(f.locator('text=Find ingredients in store'), 300);
  await f.waitForSelector('.guide');
  await wait(3600);
  await scrollTo(560);
  await wait(1800);

  // 7 — tick off
  await step(7, 'Tick items off as you walk', '“Aisle 3 · Tinned food & beans · middle shelf, next to the beans.” Coopy counts what’s left.');
  await wait(1000);
  const items = f.locator('.guide-item');
  const n = await items.count();
  for (let i = 0; i < Math.min(n, 4); i++) {
    await items.nth(i).evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await wait(700);
    await items.nth(i).click();
    await wait(900);
  }
  await scrollTo(0);
  await wait(2600);

  // 8 — call
  await step(8, 'Call Coopy', 'A voice conversation inside the app. Ask where things are and hear the answer out loud.');
  await tap(f.locator('.tab', { hasText: 'Coopy' }), 900);
  await tap(f.locator('.call-btn'), 300);
  await f.waitForSelector('.call');
  await wait(2600);
  await tap(f.locator('.call-prompts .chip', { hasText: 'Where can I find chickpeas?' }), 300);
  await wait(3800);
  await tap(f.locator('.call-prompts .chip', { hasText: 'What can I cook with them?' }), 300);
  await wait(4200);
  await tap(f.locator('.ctl.end'), 800);

  // 9 — scan
  await step(9, 'Scan & Talk on a store device', 'Scan a product to see its price and aisle, then ask Coopy what to cook with it.');
  await tap(f.locator('.tab-center'), 900);
  await wait(1200);
  await tap(f.locator('.trigger'), 300);
  await f.waitForSelector('.scan-result');
  await wait(2600);
  await tap(f.locator('text=Ask Coopy about this product'), 300);
  await f.waitForSelector('.sr-meal');
  await wait(1200);
  await center('.sr-answer');
  await wait(3800);

  await page.evaluate(() => window.showOutro('Try Coopy', 'Scan the QR code on screen and ask for dinner.'));
  await wait(3500);

  const video = page.video();
  await ctx.close();
  console.log('VIDEO', await video.path());
  await browser.close();
})();
