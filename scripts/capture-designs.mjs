import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
  for (const [name, path] of [['editorial', '/versions/editorial.html'], ['signal', '/versions/signal.html'], ['studio', '/versions/studio.html'], ['paper', '/versions/paper.html'], ['flow', '/versions/flow.html'], ['sage', '/']]) {
    await page.goto(new URL(path, process.env.PREVIEW_URL || 'http://127.0.0.1:4173').href);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: fileURLToPath(new URL(`../site/assets/preview-${name}.png`, import.meta.url)), animations: 'disabled' });
    console.log(`Captured ${name} preview`);
  }
} finally {
  await browser.close();
}
