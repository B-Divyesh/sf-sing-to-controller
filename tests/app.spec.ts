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

test('has no serious or critical automated accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  const severe = results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');
  expect(severe).toEqual([]);
});
