import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('renders the complete studio without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await expect(page).toHaveTitle(/Sing Switch/);
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Turn your voice into browser game controls' })).toBeVisible();
  await expect(page.locator('img[alt]')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('first screen states the job, audience, first actions, and three facts', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Turn your voice into browser game controls');
  await expect(page.getByText(/For game makers, music teachers, and accessible-play designers/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Set up my voice' })).toBeVisible();
  await expect(page.locator('.hero-facts li')).toHaveCount(3);
  const facts = await page.locator('.hero-facts').boundingBox();
  const viewport = page.viewportSize();
  expect(facts).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(facts!.y + facts!.height).toBeLessThanOrEqual(viewport!.height);
});

test('first-screen sample action opens a populated isolated demo in one click', async ({ page }) => {
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('#sample-count')).toHaveText('3 / 3 ready');
  await expect(page.locator('[data-kind="low"] output')).toContainText('180 Hz');
  await expect(page.locator('#state-json')).toContainText('MOVE_DOWN');
});

test('demo query entry opens the same isolated sample mode', async ({ page }) => {
  await page.goto('/?demo=1');
  await expect(page).toHaveTitle('Demo — Sing Switch');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage).sort())).toEqual([
    'demo:sing-switch-calibration',
    'demo:sing-switch-mappings',
  ]);
});

test('mapping preview updates the inspectable output', async ({ page }) => {
  const low = page.getByRole('button', { name: 'Low', exact: true });
  await low.dispatchEvent('pointerdown');
  await expect(page.locator('#state-json')).toContainText('MOVE_DOWN');
  await expect(page.locator('[data-gesture="low"] .action-light')).toHaveText('Pressed');
  await low.dispatchEvent('pointerup');
  await expect(page.locator('#output-state')).toHaveText('Idle');
});

test('keyboard starts and controls the accessible game path', async ({ page }) => {
  await page.locator('#play').scrollIntoViewIfNeeded();
  await page.keyboard.down('Space');
  await expect(page.locator('#game-live')).toHaveText('Game running');
  await page.keyboard.up('Space');
  await page.getByRole('button', { name: 'Pause route' }).click();
  await expect(page.locator('#game-live')).toHaveText('Game paused');
});

test('privacy and terms routes are readable standalone pages', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page).toHaveTitle('Privacy — Sing Switch');
  await expect(page.locator('h1')).toHaveText('Privacy for your voice data');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  await page.goto('/terms');
  await expect(page).toHaveTitle('Terms — Sing Switch');
  await expect(page.locator('h1')).toHaveText('Terms for using Sing Switch');
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
});

test('unknown routes show the designed missing-page result and return path', async ({ page }) => {
  await page.goto('/does-not-exist');
  await expect(page).toHaveTitle('Page not found — Sing Switch');
  await expect(page.locator('h1')).toHaveText('This page does not exist.');
  await expect(page.getByRole('link', { name: 'Return to Sing Switch' })).toHaveAttribute('href', '/');
  await expect(page.locator('h1')).toHaveCount(1);
});

test('every route exposes canonical and social metadata', async ({ page }) => {
  for (const route of ['/', '/demo', '/privacy', '/terms']) {
    await page.goto(route);
    const expectedCanonical = `https://sing-to-controller.sociobot.in${route}`;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', expectedCanonical);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Sing Switch/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://sing-to-controller.sociobot.in/assets/sing-switch-social.jpg');
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('sizes', '180x180');
  }
});

test('mobile viewport has no horizontal overflow', async ({ page }) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('all required touch targets are at least 44 by 44 CSS pixels', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The verifier finding is specific to the 390px layout.');
  const selectors = [
    '.site-header .brand',
    '.hero-actions .button',
    '#split-range',
    '#hold-range',
    '#noise-range',
    '.footer-brand',
    'footer nav a',
  ];
  for (const selector of selectors) {
    const targets = page.locator(selector);
    for (let index = 0; index < await targets.count(); index += 1) {
      const box = await targets.nth(index).boundingBox();
      expect(box, `${selector} should have a rendered box`).not.toBeNull();
      expect(box!.width, `${selector} width`).toBeGreaterThanOrEqual(44);
      expect(box!.height, `${selector} height`).toBeGreaterThanOrEqual(44);
    }
  }
  await page.goto('/demo');
  for (const button of await page.locator('.demo-banner button').all()) {
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});

test('recovers invalid saved setting shapes to complete defaults', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.evaluate(() => {
    localStorage.setItem('sing-switch-calibration', '{}');
    localStorage.setItem('sing-switch-mappings', '{}');
  });
  await page.reload();
  await expect(page.locator('.mapping-row')).toHaveCount(5);
  await expect(page.locator('#sample-count')).toHaveText('0 / 3 ready');
  await expect(page.locator('#split-output')).toHaveText('255 Hz');
  const stored = await page.evaluate(() => [
    localStorage.getItem('sing-switch-calibration'),
    localStorage.getItem('sing-switch-mappings'),
  ]);
  expect(stored).toEqual([null, null]);
  expect(errors).toEqual([]);
});

test('microphone permission errors give a keyboard and demo recovery path', async ({ page }) => {
  await page.getByRole('button', { name: 'Sample low' }).click();
  await expect(page.locator('#sample-status')).toContainText('Allow the microphone first');
  await expect(page.getByRole('button', { name: 'Allow microphone' })).toBeFocused();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: async () => { throw new DOMException('Denied', 'NotAllowedError'); } },
    });
  });
  await page.reload();
  await page.getByRole('button', { name: 'Allow microphone' }).click();
  await expect(page.locator('#mic-status')).toContainText('Microphone access was blocked');
  await expect(page.getByRole('link', { name: 'Try sample data' })).toBeVisible();
});

test('range boundaries persist and an invalid WebSocket scheme recovers', async ({ page }) => {
  for (const [selector, value] of [['#split-range', '100'], ['#hold-range', '400'], ['#noise-range', '5']]) {
    await page.locator(selector).evaluate((input: HTMLInputElement, nextValue) => {
      input.value = String(nextValue);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
  }
  await expect(page.locator('#split-output')).toHaveText('100 Hz');
  await expect(page.locator('#hold-output')).toHaveText('400 ms');
  await expect(page.locator('#noise-output')).toHaveText('1%');
  for (const [selector, value] of [['#split-range', '700'], ['#hold-range', '2000'], ['#noise-range', '100']]) {
    await page.locator(selector).evaluate((input: HTMLInputElement, nextValue) => {
      input.value = String(nextValue);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
  }
  await expect(page.locator('#split-output')).toHaveText('700 Hz');
  await expect(page.locator('#hold-output')).toHaveText('2000 ms');
  await expect(page.locator('#noise-output')).toHaveText('10%');
  await page.reload();
  await expect(page.locator('#split-output')).toHaveText('700 Hz');
  await expect(page.locator('#hold-output')).toHaveText('2000 ms');
  await page.locator('#socket-url').fill('https://example.com/controller');
  await page.getByRole('button', { name: 'Connect', exact: true }).click();
  await expect(page.locator('#socket-status')).toHaveText('Use an address beginning with ws:// or wss://.');
  await expect(page.getByRole('button', { name: 'Connect', exact: true })).toBeEnabled();
});

test('microphone path keeps fundamentals, completes ordered calibration, and scores only the requested route action', async ({ page }) => {
  test.setTimeout(20_000);
  await page.addInitScript(() => {
    let frequency = 220;
    let sampleOffset = 0;
    Object.defineProperty(window, '__setTestFrequency', {
      configurable: true,
      value: (next: number) => { frequency = next; },
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: async () => ({ getTracks: () => [{ stop: () => undefined }] }) },
    });
    class TestAudioContext {
      sampleRate = 48_000;
      createMediaStreamSource() { return { connect: () => undefined }; }
      createAnalyser() {
        return {
          fftSize: 2048,
          smoothingTimeConstant: 0,
          getFloatTimeDomainData: (buffer: Float32Array) => {
            for (let index = 0; index < buffer.length; index += 1) {
              buffer[index] = Math.sin((2 * Math.PI * frequency * (index + sampleOffset)) / 48_000) * 0.5;
            }
            sampleOffset += buffer.length;
          },
        };
      }
      async resume() { return undefined; }
      async close() { return undefined; }
    }
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: TestAudioContext });
  });
  await page.reload();

  await page.getByRole('button', { name: 'Allow microphone' }).click();
  await expect(page.locator('#pitch-value')).toContainText('220 Hz');
  await page.getByRole('button', { name: 'Sample low' }).click();
  await expect(page.locator('[data-kind="low"] output')).toContainText('220 Hz');

  await page.evaluate(() => (window as unknown as { __setTestFrequency: (value: number) => void }).__setTestFrequency(260));
  await expect(page.locator('#pitch-value')).toContainText('260 Hz');
  await page.getByRole('button', { name: 'Sample high' }).click();
  await expect(page.locator('[data-kind="high"] output')).toContainText('260 Hz');
  await page.getByRole('button', { name: 'Sample hold' }).click();
  await expect(page.locator('[data-kind="held"] output')).toContainText('steady');
  await expect(page.locator('#sample-count')).toHaveText('3 / 3 ready');
  await expect(page.locator('#state-json')).toContainText('MOVE_UP');
  await expect(page.locator('#accuracy')).toHaveText('—');

  await page.getByRole('button', { name: 'Start route' }).click();
  await expect(page.locator('#accuracy')).toHaveText('0%');
  await expect(page.locator('#accuracy-detail')).toContainText('matched the action requested by the gate');
  await page.getByRole('button', { name: 'Stop listening' }).click();
});

test('all public routes have no automated accessibility violations', async ({ page }) => {
  for (const route of ['/', '/demo', '/privacy', '/terms', '/does-not-exist']) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, `axe violations on ${route}`).toEqual([]);
  }
});

test('keyboard focus starts at the skip link and remains visible', async ({ page }) => {
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();
  const outline = await skip.evaluate((element) => getComputedStyle(element).outlineWidth);
  expect(Number.parseFloat(outline)).toBeGreaterThanOrEqual(3);
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});

test('reduced motion removes visible transitions and smooth scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const styles = await page.locator('.button.primary').first().evaluate((element) => ({
    transition: getComputedStyle(element).transitionDuration,
    scrolling: getComputedStyle(document.documentElement).scrollBehavior,
  }));
  const durationMs = styles.transition.endsWith('ms')
    ? Number.parseFloat(styles.transition)
    : Number.parseFloat(styles.transition) * 1000;
  expect(durationMs).toBeLessThanOrEqual(0.01);
  expect(styles.scrolling).toBe('auto');
});

test('service worker precaches the versioned shell and legal routes work offline', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One Chromium service-worker check covers the shared build.');
  const offlineContext = await browser.newContext({ baseURL: 'http://127.0.0.1:4173', serviceWorkers: 'allow' });
  try {
    const offlinePage = await offlineContext.newPage();
    await offlinePage.goto('/');
    await offlinePage.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
    });
    if (!await offlinePage.evaluate(() => navigator.serviceWorker.controller !== null)) await offlinePage.reload();
    await expect.poll(async () => offlinePage.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
    const cacheEvidence = await offlinePage.evaluate(async () => {
      const names = await caches.keys();
      const requests = await (await caches.open('sing-switch-v4')).keys();
      return { names, urls: requests.map((request) => request.url) };
    });
    expect(cacheEvidence.names).toContain('sing-switch-v4');
    expect(cacheEvidence.urls.some((url) => /\/assets\/main-[^/]+\.js$/.test(url))).toBe(true);
    expect(cacheEvidence.urls.some((url) => /\/assets\/style-[^/]+\.css$/.test(url))).toBe(true);

    await offlinePage.goto('/privacy');
    await expect(offlinePage.locator('h1')).toHaveText('Privacy for your voice data');
    await offlineContext.setOffline(true);
    await offlinePage.reload();
    await expect(offlinePage.locator('h1')).toHaveText('Privacy for your voice data');
  } finally {
    await offlineContext.setOffline(false);
    await offlineContext.close();
  }
});
