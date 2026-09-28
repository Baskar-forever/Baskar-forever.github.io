import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = ['/', '/projects/sareebot.html', '/projects/omnichannel-rag.html', '/projects/resumeai.html', '/resume.html'];

for (const path of pages) {
  test(`${path} loads, fits, and passes accessibility checks`, async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const response = await page.goto(path);
    expect(response.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toBeVisible();
    await expect(page).toHaveTitle(/Baskar R/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
    for (const image of await page.locator('img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveJSProperty('complete', true);
      expect(await image.evaluate((element) => element.naturalWidth)).toBeGreaterThan(0);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: testInfo.outputPath('page.png'), fullPage: true });
  });
}

test('internal links, fragments, and local assets resolve', async ({ page, request }) => {
  for (const path of pages) {
    await page.goto(path);
    const urls = await page.locator('a[href], img[src], script[src], link[href]').evaluateAll((elements) => [...new Set(elements.map((element) => element.href || element.src).filter((url) => url.startsWith(location.origin)))]);
    for (const url of urls) {
      const response = await request.get(url);
      expect(response.status(), url).toBe(200);
      const hash = new URL(url).hash;
      if (hash) {
        expect(await response.text(), url).toContain(`id="${decodeURIComponent(hash.slice(1))}"`);
      }
    }
  }
});

test('mobile menu supports links, Escape, and viewport changes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const button = page.locator('.menu-toggle');
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav).toBeHidden();
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(nav).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(nav).toBeHidden();
  await expect(button).toBeFocused();
  await button.click();
  await nav.getByRole('link', { name: 'Work', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#work$/);
  await expect(nav).toBeHidden();
  await expect(page.locator('#work')).toBeFocused();
  await button.focus();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(nav).toBeVisible();
  await expect(page.locator('.menu-toggle')).toBeHidden();
  await expect(nav.getByRole('link', { name: 'Work', exact: true })).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(button).toBeFocused();
});

test('email copy reports success and handles clipboard failure', async ({ page }) => {
  await page.addInitScript(() => {
    window.copiedText = null;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text) => { window.copiedText = text; } } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Copy email address' }).click();
  await expect(page.getByRole('status')).toHaveText('Email address copied.');
  expect(await page.evaluate(() => window.copiedText)).toBe('baskargceo@gmail.com');
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('Denied'); }; });
  await page.getByRole('button', { name: 'Copy email address' }).click();
  await expect(page.getByRole('status')).toContainText('Could not copy');
  await expect(page.getByRole('button', { name: 'Copy email address' })).toBeEnabled();
});

test('resume print action and print layout work', async ({ page }, testInfo) => {
  await page.goto('/resume.html');
  await page.evaluate(() => { window.print = () => { window.printInvoked = true; }; });
  await page.getByRole('button', { name: 'Print / Save PDF' }).click();
  expect(await page.evaluate(() => window.printInvoked)).toBe(true);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.resume-toolbar')).toBeHidden();
  await expect(page.locator('.site-header')).toBeHidden();
  await expect(page.locator('.resume-sheet')).toBeVisible();
  const sizes = await page.evaluate(() => [getComputedStyle(document.querySelector('.resume-sheet li')).fontSize, getComputedStyle(document.querySelector('.resume-sheet p')).fontSize]);
  expect(sizes[0]).toBe(sizes[1]);
  const pdf = await page.pdf({ path: testInfo.outputPath('resume.pdf'), preferCSSPageSize: true });
  expect(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)).toHaveLength(1);
});

test('content and navigation work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav).toBeVisible();
  await nav.getByRole('link', { name: 'Resume' }).click();
  await expect(page).toHaveURL(/resume.html$/);
  await expect(page.locator('.resume-sheet')).toBeVisible();
  await expect(page.locator('[data-print]')).toBeHidden();
  await context.close();
});

test('narrow and tablet layouts do not overflow', async ({ page }) => {
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of pages) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${path} at ${width}px`).toBe(true);
    }
  }
});

test('skip link and reduced motion preferences work', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
});

test('unknown pages return a usable 404', async ({ page }) => {
  const response = await page.goto('/not-a-real-page');
  expect(response.status()).toBe(404);
  await page.getByRole('link', { name: 'Back to the portfolio' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('AI that works');
});
