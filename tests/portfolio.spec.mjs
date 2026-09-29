import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = ['/', '/projects/sareebot.html', '/projects/omnichannel-rag.html', '/projects/resumeai.html', '/resume.html', '/versions.html', '/earlier-designs.html', '/versions/editorial.html', '/versions/signal.html', '/versions/studio.html', '/versions/paper.html', '/versions/flow.html'];

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
    await page.screenshot({ path: testInfo.outputPath('page.png'), fullPage: true, scale: 'css' });
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

test('archived Editorial menu supports links, Escape, and viewport changes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/versions/editorial.html');
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
  await expect(page.getByRole('heading', { level: 1 })).toContainText("Hi, I'm Baskar.");
});

test('archived Editorial previews respond only to a fine mouse pointer and leave text still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/versions/editorial.html');
  const enabled = await page.evaluate(() => matchMedia('(min-width: 801px) and (hover: hover) and (pointer: fine)').matches);
  for (const scene of await page.locator('[data-depth]').all()) {
    await scene.scrollIntoViewIfNeeded();
    const box = await scene.boundingBox();
    const point = { clientX: box.x + box.width * .85, clientY: box.y + box.height * .75 };
    await scene.dispatchEvent('pointermove', { ...point, pointerType: 'touch' });
    expect(await scene.evaluate((element) => element.style.getPropertyValue('--tilt-y'))).toBe('');
    await scene.dispatchEvent('pointermove', { ...point, pointerType: 'mouse' });
    if (enabled) {
      await expect.poll(() => scene.evaluate((element) => parseFloat(element.style.getPropertyValue('--tilt-y')))).toBeGreaterThan(0);
      const values = await scene.evaluate((element) => ['--tilt-x', '--tilt-y'].map((name) => Math.abs(parseFloat(element.style.getPropertyValue(name)))));
      for (const value of values) expect(value).toBeLessThanOrEqual(Number(await scene.getAttribute('data-depth')));
    } else {
      expect(await scene.evaluate((element) => element.style.getPropertyValue('--tilt-y'))).toBe('');
    }
    await scene.dispatchEvent('pointerleave');
    expect(await scene.evaluate((element) => element.style.getPropertyValue('--tilt-y'))).toBe('');
  }
  for (const text of await page.locator('.hero-copy, .project-copy').all()) {
    await expect(text).toHaveCSS('transform', 'none');
  }
});

test('archived Editorial motion resets for reduced motion or small viewports', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/versions/editorial.html');
  const scene = page.locator('.system-scene');
  const box = await scene.boundingBox();
  const point = { clientX: box.x + box.width * .8, clientY: box.y + box.height * .8, pointerType: 'mouse' };
  await scene.dispatchEvent('pointermove', point);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => scene.evaluate((element) => element.style.getPropertyValue('--tilt-y'))).toBe('');
  await scene.dispatchEvent('pointermove', point);
  await expect(page.locator('.system-steps')).toHaveCSS('transform', 'none');
  for (const picture of await page.locator('.project-preview picture').all()) await expect(picture).toHaveCSS('transform', 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await scene.dispatchEvent('pointermove', point);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => scene.evaluate((element) => element.style.getPropertyValue('--tilt-y'))).toBe('');
  await expect(page.locator('.system-steps')).toHaveCSS('transform', 'none');
  await page.screenshot({ path: testInfo.outputPath('mobile-depth.png'), fullPage: true, scale: 'css' });
});

test('design collection opens all three full homepages', async ({ page }) => {
  for (const [name, path] of [['Paper', '/versions/paper.html'], ['Flow', '/versions/flow.html'], ['Sage', '/index.html']]) {
    await page.goto('/versions.html');
    await page.getByRole('link', { name: `Explore ${name}`, exact: false }).click();
    expect(new URL(page.url()).pathname).toBe(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /\bresume\b/i }).first()).toHaveAttribute('href', /resume.html$/);
  }
});

for (const design of ['signal', 'studio', 'paper', 'flow']) {
  test(`${design} has functional navigation, depth, and no external runtime requests`, async ({ page }) => {
    const external = [];
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') external.push(request.url());
    });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(`/versions/${design}.html`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
    const toggle = page.locator('.menu-toggle');
    if (await toggle.isVisible()) await toggle.click();
    await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'Work', exact: true }).click();
    await expect(page.locator('#work')).toBeFocused();
    const scene = page.locator('[data-depth]');
    await scene.scrollIntoViewIfNeeded();
    const box = await scene.boundingBox();
    const point = { clientX: box.x + box.width * .8, clientY: box.y + box.height * .7, pointerType: 'mouse' };
    await scene.dispatchEvent('pointermove', point);
    const enabled = await page.evaluate(() => matchMedia('(min-width:801px) and (hover:hover) and (pointer:fine)').matches);
    if (enabled) await expect.poll(() => scene.evaluate((element) => parseFloat(element.style.getPropertyValue('--tilt-y')))).toBeGreaterThan(0);
    else expect(await scene.evaluate((element) => element.style.getPropertyValue('--tilt-y'))).toBe('');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(() => scene.evaluate((element) => element.style.getPropertyValue('--tilt-y'))).toBe('');
    await expect(page.locator(design === 'signal' ? '.assembly' : design === 'studio' ? '.sculpture' : '.depth-object')).toHaveCSS('transform', 'none');
    await expect(page.locator('.hero-copy')).toHaveCSS('transform', 'none');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
    expect(external).toEqual([]);
  });
}

test('alternative homepages work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  for (const name of ['editorial', 'signal', 'studio', 'paper', 'flow']) {
    await page.goto(`http://127.0.0.1:4173/versions/${name}.html`);
    const navigation = page.getByRole('navigation', { name: 'Main navigation', exact: true });
    await expect(navigation).toBeVisible();
    await navigation.getByRole('link', { name: /Resume/ }).click();
    await expect(page.locator('.resume-sheet')).toBeVisible();
  }
  await context.close();
});

test('selected Sage homepage opens and returns from every matching case study', async ({ page }) => {
  for (const project of ['sareebot', 'omnichannel-rag', 'resumeai']) {
    await page.goto('/');
    await expect(page.locator('#main-nav')).toBeVisible();
    await expect(page.locator('link[rel="stylesheet"]').first()).toHaveAttribute('href', 'assets/sage.css');
    await page.locator(`a[href="projects/${project}.html"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`/projects/${project}\\.html$`));
    await expect(page.locator('link[href="../assets/sage.css"]')).toHaveCount(1);
    await expect(page.locator('.case-preview')).toBeVisible();
    await expect(page.locator('.case-art-note')).toContainText('Conceptual workflow illustration');
    await page.getByRole('link', { name: 'Back to all work', exact: true }).first().click();
    await expect(page).toHaveURL(/index.html#work$/);
    await expect(page.locator('#work')).toBeFocused();
  }
});

for (const path of ['/', '/projects/sareebot.html', '/projects/omnichannel-rag.html', '/projects/resumeai.html']) {
  test(`${path} Sage depth is bounded, optional, and keeps reading surfaces still`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(path);
    const scene = page.locator('[data-depth]');
    await expect(scene).toHaveCount(1);
    await scene.scrollIntoViewIfNeeded();
    const box = await scene.boundingBox();
    const point = { clientX: box.x + box.width * .85, clientY: box.y + box.height * .7 };
    await scene.dispatchEvent('pointermove', { ...point, pointerType: 'touch' });
    expect(await scene.evaluate((element) => element.style.getPropertyValue('--tilt-y'))).toBe('');
    await scene.dispatchEvent('pointermove', { ...point, pointerType: 'mouse' });
    const enabled = await page.evaluate(() => matchMedia('(min-width:801px) and (hover:hover) and (pointer:fine)').matches);
    if (enabled) {
      await expect.poll(() => scene.evaluate((element) => parseFloat(element.style.getPropertyValue('--tilt-y')))).toBeGreaterThan(0);
      expect(await scene.evaluate((element) => Math.abs(parseFloat(element.style.getPropertyValue('--tilt-y'))))).toBeLessThanOrEqual(3);
    } else {
      expect(await scene.evaluate((element) => element.style.getPropertyValue('--tilt-y'))).toBe('');
    }
    await expect(page.locator('h1')).toHaveCSS('transform', 'none');
    await expect(page.locator('figcaption')).toHaveCSS('transform', 'none');
    if (path !== '/') await expect(page.locator('.case-content')).toHaveCSS('transform', 'none');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(() => scene.evaluate((element) => element.style.getPropertyValue('--tilt-y'))).toBe('');
    await expect(page.locator('.depth-object')).toHaveCSS('transform', 'none');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.setViewportSize({ width: 320, height: 844 });
    await expect(page.locator('.depth-object')).toHaveCSS('transform', 'none');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('the former Sage preview resolves to the selected homepage', async ({ page }) => {
  await page.goto('/versions/sage.html');
  await expect(page).toHaveURL(/\/index.html$/);
  await expect(page.locator('h1')).toContainText("Hi, I'm Baskar.");
  await expect(page.locator('.intelligence-figure')).toBeVisible();
});

test('hero explorer connects each use case to its steps and project', async ({ page, isMobile }) => {
  const external = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') external.push(request.url());
  });
  await page.goto('/');
  await expect(page.getByLabel('Explore a workflow')).toHaveValue('rag');
  await expect(page.locator('#workflow-help')).toContainText('not live AI');
  for (const [scenario, project, heading] of [
    ['rag', 'omnichannel-rag', 'Answer with sources'],
    ['voice', 'sareebot', 'Move the order forward'],
    ['resume', 'resumeai', 'Render the document'],
  ]) {
    await page.getByLabel('Explore a workflow').selectOption(scenario);
    for (const stage of ['knowledge', 'reasoning', 'actions']) {
      const button = page.getByRole('button', { name: `Explore ${stage}`, exact: true });
      if (isMobile) await button.tap();
      else await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('[data-workflow-step][aria-pressed="true"]')).toHaveCount(1);
    }
    await expect(page.locator('[data-workflow-heading]')).toHaveText(heading);
    await expect(page.locator('[data-workflow-project]')).toHaveAttribute('href', `projects/${project}.html`);
  }
  expect(external).toEqual([]);
});

test('hero playback pauses, resumes, completes, and resets without stale timers', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Play workflow', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause workflow', exact: true })).toBeVisible();
  await page.clock.runFor(2400);
  await expect(page.locator('[data-workflow-position]')).toHaveText('Step 2 of 3 / Reasoning');
  await page.getByRole('button', { name: 'Pause workflow', exact: true }).click();
  await page.clock.runFor(8000);
  await expect(page.locator('[data-workflow-position]')).toHaveText('Step 2 of 3 / Reasoning');
  await page.getByRole('button', { name: 'Play workflow', exact: true }).click();
  await page.clock.runFor(4800);
  await expect(page.locator('[data-workflow-position]')).toHaveText('Walkthrough complete / Actions');
  await expect(page.getByRole('button', { name: 'Replay workflow', exact: true })).toBeVisible();
  await expect(page.locator('[data-workflow-explorer]')).not.toHaveClass(/workflow-playing/);
  await page.getByRole('button', { name: 'Replay workflow', exact: true }).click();
  await expect(page.locator('[data-workflow-position]')).toHaveText('Step 1 of 3 / Knowledge');
  await page.getByLabel('Explore a workflow').selectOption('voice');
  await page.clock.runFor(8000);
  await expect(page.locator('[data-workflow-heading]')).toHaveText('Look up the product');
  await page.getByRole('button', { name: 'Play workflow', exact: true }).click();
  await page.getByRole('button', { name: 'Explore actions', exact: true }).click();
  await page.clock.runFor(8000);
  await expect(page.locator('[data-workflow-position]')).toHaveText('Step 3 of 3 / Actions');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.locator('[data-workflow-position]')).toHaveText('Step 1 of 3 / Knowledge');
  await expect(page.getByLabel('Explore a workflow')).toHaveValue('voice');
});

test('hero explorer works with keyboard and reduced motion', async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const reasoning = page.getByRole('button', { name: 'Explore reasoning', exact: true });
  await reasoning.focus();
  await page.keyboard.press('Enter');
  await expect(reasoning).toHaveAttribute('aria-pressed', 'true');
  await expect(reasoning).toBeFocused();
  await expect(page.locator('.depth-object')).toHaveCSS('transform', 'none');
  await page.getByRole('button', { name: 'Play workflow', exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Pause workflow', exact: true })).toBeFocused();
  await expect(page.locator('[data-workflow-trace]')).toHaveCSS('animation-name', 'none');
  await page.clock.runFor(2400);
  await expect(page.locator('[data-workflow-position]')).toHaveText('Step 3 of 3 / Actions');
  await page.keyboard.press('Space');
  await expect(page.locator('[data-workflow-explorer]')).not.toHaveClass(/workflow-playing/);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('hero walkthrough pauses when hidden and has a no-JavaScript fallback', async ({ page, browser }) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Play workflow', exact: true }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.runFor(8000);
  await expect(page.locator('[data-workflow-position]')).toHaveText('Step 1 of 3 / Knowledge');
  await expect(page.getByRole('button', { name: 'Play workflow', exact: true })).toBeVisible();
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto('http://127.0.0.1:4173/');
  await expect(staticPage.locator('[data-workflow-fallback]')).toBeVisible();
  await expect(staticPage.locator('.workflow-controls')).toBeHidden();
  await expect(staticPage.locator('.orbit-hotspots')).toBeHidden();
  await expect(staticPage.locator('.intelligence-orbit')).toBeVisible();
  await context.close();
});
