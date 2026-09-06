import { expect, test, type Page } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:4173';

async function installAudioDouble(page: Page, initialFrequency = 220): Promise<void> {
  await page.addInitScript((startFrequency) => {
    let frequency = startFrequency;
    let sampleOffset = 0;
    let mediaCalls = 0;
    let stoppedTracks = 0;
    let recorderCalls = 0;
    let speechCalls = 0;
    Object.defineProperties(window, {
      __setTestFrequency: { configurable: true, value: (next: number) => { frequency = next; } },
      __privacyCounters: {
        configurable: true,
        value: () => ({ mediaCalls, stoppedTracks, recorderCalls, speechCalls }),
      },
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => {
          mediaCalls += 1;
          return { getTracks: () => [{ stop: () => { stoppedTracks += 1; } }] };
        },
      },
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
    class TestMediaRecorder {
      constructor() { recorderCalls += 1; }
    }
    class TestSpeechRecognition {
      constructor() { speechCalls += 1; }
    }
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: TestAudioContext });
    Object.defineProperty(window, 'MediaRecorder', { configurable: true, value: TestMediaRecorder });
    Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: TestSpeechRecognition });
    Object.defineProperty(window, 'webkitSpeechRecognition', { configurable: true, value: TestSpeechRecognition });
  }, initialFrequency);
}

async function openDemo(page: Page): Promise<void> {
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('#sample-count')).toHaveText('3 / 3 ready');
}

test('@claim:demo-isolation demo changes and reset never alter real setup', async ({ page }) => {
  const realCalibration = JSON.stringify({ lowHz: 200, highHz: 450, holdMs: 900, noiseFloor: 0.02 });
  const realMappings = JSON.stringify([
    { gesture: 'low', action: 'BUTTON_A', key: 'KeyA' },
    { gesture: 'high', action: 'BUTTON_B', key: 'KeyB' },
    { gesture: 'held', action: 'BOOST', key: 'Space' },
    { gesture: 'onset', action: 'NONE', key: '' },
    { gesture: 'silence', action: 'NONE', key: '' },
  ]);
  await page.addInitScript(({ calibration, mappings }) => {
    localStorage.setItem('sing-switch-calibration', calibration);
    localStorage.setItem('sing-switch-mappings', mappings);
  }, { calibration: realCalibration, mappings: realMappings });
  await openDemo(page);
  await page.locator('#map-low').selectOption('BUTTON_B');
  await page.locator('#split-range').evaluate((input: HTMLInputElement) => {
    input.value = '310';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await expect(page.locator('#split-output')).toHaveText('255 Hz');
  await page.locator('footer').scrollIntoViewIfNeeded();
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  expect(await page.evaluate(() => [
    localStorage.getItem('sing-switch-calibration'),
    localStorage.getItem('sing-switch-mappings'),
  ])).toEqual([realCalibration, realMappings]);
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/#studio$/);
  await expect(page.locator('#split-output')).toHaveText('300 Hz');
  expect(await page.evaluate(() => [
    localStorage.getItem('demo:sing-switch-calibration'),
    localStorage.getItem('demo:sing-switch-mappings'),
  ])).toEqual([null, null]);
});

test('@claim:demo-populated demo opens with three realistic gestures and live output', async ({ page }) => {
  await openDemo(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Test vocal controls with sample data');
  await expect(page.locator('.demo-summary')).toContainText('Low · 180 Hz');
  await expect(page.locator('.demo-summary')).toContainText('High · 360 Hz');
  await expect(page.locator('.demo-summary')).toContainText('Held · 850 ms');
  await expect(page.locator('#state-json')).toContainText('MOVE_DOWN');
  await expect(page.locator('[data-gesture="low"] .action-light')).toHaveText('Pressed');
});

test('@claim:three-gesture-calibration low, high, and held samples complete through microphone analysis', async ({ page }) => {
  test.setTimeout(25_000);
  await installAudioDouble(page, 220);
  await openDemo(page);
  await page.getByRole('button', { name: 'Allow microphone' }).click();
  await expect(page.locator('#pitch-value')).toContainText('220 Hz');
  await page.getByRole('button', { name: 'Sample low' }).click();
  await expect(page.locator('[data-kind="low"] output')).toContainText('220 Hz');
  await page.evaluate(() => (window as unknown as { __setTestFrequency: (value: number) => void }).__setTestFrequency(330));
  await expect(page.locator('#pitch-value')).toContainText('330 Hz');
  await page.getByRole('button', { name: 'Sample high' }).click();
  await expect(page.locator('[data-kind="high"] output')).toContainText('330 Hz');
  await page.getByRole('button', { name: 'Sample hold' }).click();
  await expect(page.locator('[data-kind="held"] output')).toContainText('steady');
  await expect(page.locator('#sample-count')).toHaveText('3 / 3 ready');
});

test('@claim:pitch-actions sample low, high, and held gestures produce their mapped actions', async ({ page }) => {
  await openDemo(page);
  const cases = [
    { button: 'Low', action: 'MOVE_DOWN' },
    { button: 'High', action: 'MOVE_UP' },
    { button: 'Hold', action: 'BOOST' },
  ];
  for (const item of cases) {
    const button = page.getByRole('button', { name: item.button, exact: true });
    await button.dispatchEvent('pointerdown');
    await expect(page.locator('#state-json')).toContainText(item.action);
    await button.dispatchEvent('pointerup');
  }
  await page.locator('#map-low').selectOption('BUTTON_A');
  const low = page.getByRole('button', { name: 'Low', exact: true });
  await low.dispatchEvent('pointerdown');
  await expect(page.locator('#state-json')).toContainText('BUTTON_A');
});

test('@claim:local-audio microphone analysis sends no audio request', async ({ page }) => {
  await installAudioDouble(page);
  const requests: Array<{ method: string; url: string }> = [];
  page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
  await openDemo(page);
  const before = requests.length;
  await page.getByRole('button', { name: 'Allow microphone' }).click();
  await expect(page.locator('#pitch-value')).toContainText('220 Hz');
  await page.getByRole('button', { name: 'Stop listening' }).click();
  const microphoneRequests = requests.slice(before);
  expect(microphoneRequests.every((request) => request.method === 'GET')).toBe(true);
  expect(microphoneRequests.every((request) => new URL(request.url).origin === BASE_URL)).toBe(true);
});

test('@claim:no-voice-retention microphone use invokes no recorder or speech recognition', async ({ page }) => {
  await installAudioDouble(page);
  await openDemo(page);
  await page.getByRole('button', { name: 'Allow microphone' }).click();
  await expect(page.locator('#pitch-value')).toContainText('220 Hz');
  await page.getByRole('button', { name: 'Stop listening' }).click();
  const evidence = await page.evaluate(async () => ({
    counters: (window as unknown as { __privacyCounters: () => Record<string, number> }).__privacyCounters(),
    databases: indexedDB.databases ? await indexedDB.databases() : [],
    sessionKeys: Object.keys(sessionStorage),
  }));
  expect(evidence.counters).toMatchObject({ recorderCalls: 0, speechCalls: 0 });
  expect(evidence.databases).toEqual([]);
  expect(evidence.sessionKeys).toEqual([]);
});

test('@claim:local-settings real changes store only calibration and mappings', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/#studio$/);
  await page.locator('#map-high').selectOption('BUTTON_B');
  await page.locator('#hold-range').evaluate((input: HTMLInputElement) => {
    input.value = '1000';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const stored = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  expect(Object.keys(stored).sort()).toEqual(['sing-switch-calibration', 'sing-switch-mappings']);
  expect(JSON.parse(stored['sing-switch-calibration'])).toMatchObject({ holdMs: 1000 });
  expect(JSON.parse(stored['sing-switch-mappings'])).toHaveLength(5);
});

test('@claim:browser-event preview dispatches a versioned sing-switch event', async ({ page }) => {
  await openDemo(page);
  await page.evaluate(() => {
    (window as unknown as { __controllerEvent?: unknown }).__controllerEvent = undefined;
    window.addEventListener('sing-switch', (event) => {
      (window as unknown as { __controllerEvent?: unknown }).__controllerEvent = (event as CustomEvent).detail;
    }, { once: true });
  });
  await page.getByRole('button', { name: 'High', exact: true }).dispatchEvent('pointerdown');
  const detail = await page.evaluate(() => (window as unknown as { __controllerEvent: unknown }).__controllerEvent);
  expect(detail).toMatchObject({ version: 1, gesture: 'high', activeActions: ['MOVE_UP'], keys: ['ArrowUp'] });
});

test('@claim:synthetic-keyboard mapped previews emit keyboard events', async ({ page }) => {
  await openDemo(page);
  await page.evaluate(() => {
    (window as unknown as { __syntheticKeys: string[] }).__syntheticKeys = [];
    window.addEventListener('keydown', (event) => {
      if (!event.isTrusted) (window as unknown as { __syntheticKeys: string[] }).__syntheticKeys.push(event.code);
    });
  });
  await page.getByRole('button', { name: 'High', exact: true }).dispatchEvent('pointerdown');
  expect(await page.evaluate(() => (window as unknown as { __syntheticKeys: string[] }).__syntheticKeys)).toContain('ArrowUp');
});

test('@claim:untrusted-input generated keyboard events remain browser-untrusted', async ({ page }) => {
  await openDemo(page);
  const low = page.getByRole('button', { name: 'Low', exact: true });
  await low.dispatchEvent('pointerdown');
  await low.dispatchEvent('pointerup');
  await page.evaluate(() => {
    (window as unknown as { __eventTrust: boolean[] }).__eventTrust = [];
    window.addEventListener('keydown', (event) => {
      if (event.code === 'ArrowDown') (window as unknown as { __eventTrust: boolean[] }).__eventTrust.push(event.isTrusted);
    });
  });
  await low.dispatchEvent('pointerdown');
  expect(await page.evaluate(() => (window as unknown as { __eventTrust: boolean[] }).__eventTrust)).toEqual([false]);
});

test('@claim:json-export export downloads a complete compact mapping', async ({ page }) => {
  await openDemo(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export mapping' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const exported = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
  expect(download.suggestedFilename()).toBe('sing-switch-mapping.json');
  expect(exported).toMatchObject({ product: 'sing-switch', version: 1, browserEvent: 'sing-switch' });
  expect(exported.calibration).toEqual({ lowHz: 180, highHz: 360, holdMs: 850, noiseFloor: 0.018 });
  expect(exported.mappings).toHaveLength(5);
});

test('@claim:copy-state copies the current controller JSON', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE_URL });
  await openDemo(page);
  await page.getByRole('button', { name: 'Copy state' }).click();
  await expect(page.locator('#copy-status')).toHaveText('Controller state copied.');
  const copied = JSON.parse(await page.evaluate(() => navigator.clipboard.readText())) as Record<string, unknown>;
  expect(copied).toMatchObject({ version: 1, gesture: 'low', activeActions: ['MOVE_DOWN'] });
});

test('@claim:websocket-json optional WebSocket sends controller JSON without audio', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __socketMessages: string[] }).__socketMessages = [];
    class TestWebSocket extends EventTarget {
      static OPEN = 1;
      readyState = 0;
      constructor(_url: string) {
        super();
        setTimeout(() => {
          this.readyState = TestWebSocket.OPEN;
          this.dispatchEvent(new Event('open'));
        });
      }
      send(message: string) {
        (window as unknown as { __socketMessages: string[] }).__socketMessages.push(message);
      }
      close() {
        this.readyState = 3;
        this.dispatchEvent(new Event('close'));
      }
    }
    Object.defineProperty(window, 'WebSocket', { configurable: true, value: TestWebSocket });
  });
  await openDemo(page);
  await page.getByRole('button', { name: 'Connect', exact: true }).click();
  await expect(page.locator('#socket-status')).toContainText('Connected');
  const high = page.getByRole('button', { name: 'High', exact: true });
  await high.dispatchEvent('pointerdown');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __socketMessages: string[] }).__socketMessages.length)).toBeGreaterThan(0);
  const messages = await page.evaluate(() => (window as unknown as { __socketMessages: string[] }).__socketMessages.map(JSON.parse));
  expect(messages.some((message: Record<string, unknown>) => Array.isArray(message.activeActions) && message.activeActions.includes('MOVE_UP'))).toBe(true);
  for (const message of messages) {
    expect(Object.keys(message).sort()).toEqual(['activeActions', 'clarity', 'gesture', 'keys', 'level', 'pitchHz', 'timestamp', 'version']);
  }
});

test('@claim:keyboard-game keyboard input completes the three-gate game', async ({ page }) => {
  test.setTimeout(25_000);
  await openDemo(page);
  const low = page.getByRole('button', { name: 'Low', exact: true });
  await low.dispatchEvent('pointerdown');
  await low.dispatchEvent('pointerup');
  await page.locator('#play').scrollIntoViewIfNeeded();
  await page.keyboard.down('ArrowDown');
  await expect(page.locator('#game-live')).toHaveText('Game running');
  await page.waitForTimeout(1000);
  await page.keyboard.up('ArrowDown');
  await page.keyboard.down('Space');
  await expect(page.locator('#game-progress')).toHaveText('1 of 3 gates', { timeout: 4_000 });
  await page.keyboard.up('Space');
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(1750);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('Space');
  await expect(page.locator('#game-progress')).toHaveText('2 of 3 gates', { timeout: 4_000 });
  await page.keyboard.up('Space');
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(900);
  await page.keyboard.up('ArrowDown');
  await page.keyboard.down('Space');
  await expect(page.locator('#game-progress')).toHaveText('3 of 3 gates', { timeout: 4_000 });
  await page.keyboard.up('Space');
  await expect(page.locator('#game-live')).toHaveText('Route complete');
  await expect(page.locator('#game-status')).toContainText('Route complete in 3 gate attempts');
});

test('@claim:offline-reload demo reloads offline after the first visit', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: BASE_URL, serviceWorkers: 'allow' });
  try {
    const page = await context.newPage();
    await page.goto('/demo');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    if (!await page.evaluate(() => navigator.serviceWorker.controller !== null)) await page.reload();
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
    await expect(page.locator('#sample-count')).toHaveText('3 / 3 ready');
    await expect(page.locator('#state-json')).toContainText('MOVE_DOWN');
    await page.goto('/privacy');
    await expect(page.locator('h1')).toHaveText('Privacy for your voice data');
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Turn your voice into browser game controls');
  } finally {
    await context.setOffline(false);
    await context.close();
  }
});

test('@claim:tracking-free full demo flow has no cookies or third-party requests', async ({ page, context }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openDemo(page);
  await page.getByRole('button', { name: 'High', exact: true }).dispatchEvent('pointerdown');
  await page.getByRole('button', { name: 'High', exact: true }).dispatchEvent('pointerup');
  await page.getByRole('button', { name: 'Start route' }).click();
  await page.getByRole('button', { name: 'Pause route' }).click();
  await page.goto('/privacy');
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every((url) => new URL(url).origin === BASE_URL)).toBe(true);
  expect(await context.cookies()).toEqual([]);
  expect(await page.evaluate(() => Object.keys(localStorage).every((key) => key.startsWith('demo:')))).toBe(true);
});

test('@claim:free-core sample, game, and export work without login or payment', async ({ page }) => {
  await openDemo(page);
  await expect(page.locator('input[type="email"], input[type="password"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Start route' }).click();
  await expect(page.locator('#game-live')).toHaveText('Game running');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export mapping' }).click();
  await downloadPromise;
  await expect(page).toHaveURL(/\/demo$/);
});

test('@claim:non-goals output has no transcript or identity and no speech API runs', async ({ page }) => {
  await installAudioDouble(page);
  await openDemo(page);
  await page.getByRole('button', { name: 'Allow microphone' }).click();
  await expect(page.locator('#state-json')).toContainText('pitchHz');
  const output = JSON.parse(await page.locator('#state-json').textContent() || '{}') as Record<string, unknown>;
  expect(output).not.toHaveProperty('transcript');
  expect(output).not.toHaveProperty('identity');
  expect((await page.evaluate(() => (window as unknown as { __privacyCounters: () => Record<string, number> }).__privacyCounters())).speechCalls).toBe(0);
  await page.getByRole('button', { name: 'Stop listening' }).click();
});

test('@claim:reset-storage reset setup removes saved real settings', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Start for real' }).click();
  await page.locator('#map-low').selectOption('BUTTON_A');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('sing-switch-mappings'))).not.toBeNull();
  await page.getByRole('button', { name: 'Reset setup', exact: true }).click();
  await expect(page.locator('#sample-count')).toHaveText('0 / 3 ready');
  expect(await page.evaluate(() => [
    localStorage.getItem('sing-switch-calibration'),
    localStorage.getItem('sing-switch-mappings'),
  ])).toEqual([null, null]);
});

test('@claim:microphone-control microphone starts only on request and its track stops', async ({ page }) => {
  await installAudioDouble(page);
  await openDemo(page);
  expect(await page.evaluate(() => (window as unknown as { __privacyCounters: () => Record<string, number> }).__privacyCounters())).toMatchObject({ mediaCalls: 0, stoppedTracks: 0 });
  await page.getByRole('button', { name: 'Allow microphone' }).click();
  await expect(page.locator('#pitch-value')).toContainText('220 Hz');
  expect(await page.evaluate(() => (window as unknown as { __privacyCounters: () => Record<string, number> }).__privacyCounters())).toMatchObject({ mediaCalls: 1, stoppedTracks: 0 });
  await page.getByRole('button', { name: 'Stop listening' }).click();
  expect(await page.evaluate(() => (window as unknown as { __privacyCounters: () => Record<string, number> }).__privacyCounters())).toMatchObject({ mediaCalls: 1, stoppedTracks: 1 });
});
