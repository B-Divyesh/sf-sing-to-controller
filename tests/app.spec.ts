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
  await expect(page.getByRole('heading', { name: 'Make your voice a game control.' })).toBeVisible();
  await expect(page.locator('img[alt]')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('demo setup makes all three calibration samples ready', async ({ page }) => {
  await page.getByRole('button', { name: 'Use demo setup' }).click();
  await expect(page.locator('#sample-count')).toHaveText('3 / 3 ready');
  await expect(page.locator('[data-kind="low"] output')).toContainText('180 Hz');
  await expect(page.locator('#sample-status')).toContainText('keyboard path');
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
  await expect(page.locator('h1')).toHaveText('Your voice stays here.');
  await expect(page.locator('h1')).toHaveCount(1);
  await page.goto('/terms');
  await expect(page.locator('h1')).toHaveText('A small tool, used fairly.');
});

test('mobile viewport has no horizontal overflow', async ({ page }) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('all required touch targets are at least 44 by 44 CSS pixels', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The verifier finding is specific to the 390px layout.');
  const selectors = [
    '.site-header .brand',
    '.hero-actions .text-link',
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

test('has no automated accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('service worker precaches the versioned shell and legal routes work offline', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One Chromium service-worker check covers the shared build.');
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
  });
  await expect.poll(async () => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
  const cacheEvidence = await page.evaluate(async () => {
    const names = await caches.keys();
    const requests = await (await caches.open('sing-switch-v2')).keys();
    return { names, urls: requests.map((request) => request.url) };
  });
  expect(cacheEvidence.names).toContain('sing-switch-v2');
  expect(cacheEvidence.urls.some((url) => /\/assets\/index-[^/]+\.js$/.test(url))).toBe(true);
  expect(cacheEvidence.urls.some((url) => /\/assets\/style-[^/]+\.css$/.test(url))).toBe(true);

  await page.goto('/privacy');
  await expect(page.locator('h1')).toHaveText('Your voice stays here.');
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('h1')).toHaveText('Your voice stays here.');
  await context.setOffline(false);
});
