import '@fontsource/space-grotesk/latin-600.css';
import '@fontsource/space-grotesk/latin-700.css';
import './style.css';
import {
  ACTION_KEYS,
  DEFAULT_CALIBRATION,
  DEFAULT_MAPPINGS,
  MicrophonePitchSource,
  makeState,
  median,
  type ActionId,
  type Calibration,
  type ControllerState,
  type Gesture,
  type Mapping,
  type PitchResult,
} from './engine';
import { FerryGame } from './game';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App root not found');

const legalPage = location.pathname === '/privacy' || location.pathname === '/terms';

function footer(): string {
  return `
    <footer>
      <div class="footer-inner">
        <a class="brand footer-brand" href="/" aria-label="Sing Switch home"><span class="brand-wave" aria-hidden="true">∿</span> Sing Switch</a>
        <p>Local-first vocal controls for playful experiments. No voice recordings leave your device.</p>
        <nav aria-label="Legal"><a href="/privacy">Privacy</a><a href="/terms">Terms</a></nav>
        <p class="fine-print">The acoustic landscape is original AI-generated artwork. Built as an open, inspectable input tool.</p>
      </div>
    </footer>`;
}

if (legalPage) {
  const privacy = location.pathname === '/privacy';
  document.title = `${privacy ? 'Privacy' : 'Terms'} — Sing Switch`;
  app.innerHTML = `
    <header class="site-header compact"><a class="brand" href="/"><span class="brand-wave" aria-hidden="true">∿</span> Sing Switch</a></header>
    <main id="main" class="legal-shell">
      <a class="back-link" href="/">← Back to the studio</a>
      <p class="eyebrow">Plain-language ${privacy ? 'privacy' : 'terms'}</p>
      <h1>${privacy ? 'Your voice stays here.' : 'A small tool, used fairly.'}</h1>
      ${privacy ? `
        <p class="lede">Sing Switch processes microphone samples in your browser. It does not upload, retain, transcribe, or identify your voice.</p>
        <h2>What is stored</h2><p>Your pitch thresholds and action mappings are saved in local browser storage so they are ready next time. You can erase them with “Reset setup” or by clearing this site’s data.</p>
        <h2>Microphone access</h2><p>Access begins only after you press “Allow microphone” and ends when you stop listening or close the page. Audio is analyzed in short memory buffers and never recorded.</p>
        <h2>Connections you choose</h2><p>The optional WebSocket output connects only to the address you enter. Controller data—not audio—is sent to that address. That destination’s privacy practices are outside Sing Switch.</p>
        <h2>Analytics and accounts</h2><p>There are no accounts, ads, tracking cookies, fingerprinting, or third-party analytics. The app works offline after its first successful load.</p>` : `
        <p class="lede">Sing Switch is free to use for prototypes, teaching, and accessible-play experiments. It comes without a promise that pitch detection will suit every voice, room, or game.</p>
        <h2>Use it safely</h2><p>Keep listening volume comfortable, take breaks, and always provide another input path. Do not use the tool for emergency, medical, biometric, authentication, or competitive anti-cheat purposes.</p>
        <h2>Your integrations</h2><p>You are responsible for projects and WebSocket destinations you connect. Synthetic keyboard events are an integration aid and are not equivalent to trusted operating-system input.</p>
        <h2>Warranty</h2><p>The software is provided “as is” under the MIT License, without warranty. Stop using it if it causes discomfort or does not recognize inputs reliably.</p>`}
      <p class="fine-print">Effective 28 August 2026.</p>
    </main>${footer()}`;
} else {
  app.innerHTML = `
    <header class="site-header">
      <a class="brand" href="#top" aria-label="Sing Switch home"><span class="brand-wave" aria-hidden="true">∿</span> Sing Switch</a>
      <nav aria-label="Primary"><a href="#studio">Studio</a><a href="#play">Test game</a><a href="#connect">Connect</a></nav>
      <span class="network-state" id="network-state"><span aria-hidden="true"></span> Online</span>
    </header>
    <main id="main">
      <section class="hero" id="top" aria-labelledby="hero-title">
        <picture class="hero-art"><img src="/assets/sound-landscape.webp" alt="A luminous voice waveform crossing three translucent glass control gates" width="1200" height="800" fetchpriority="high" decoding="async"></picture>
        <div class="hero-copy">
          <p class="eyebrow"><span>Private by design</span> · No model training</p>
          <h1 id="hero-title">Make your voice<br><em>a game control.</em></h1>
          <p class="lede">Calibrate a low note, a high note, and a hold. Sing Switch turns them into visible browser controls—without recording a second of audio.</p>
          <div class="hero-actions"><a class="button primary" href="#studio">Set up my voice <span aria-hidden="true">↓</span></a><a class="text-link" href="#play">Or try the keyboard path</a></div>
        </div>
        <div class="signal-key" aria-label="How Sing Switch works">
          <span><b>01</b> Listen locally</span><i aria-hidden="true"></i><span><b>02</b> Place gestures</span><i aria-hidden="true"></i><span><b>03</b> Play & export</span>
        </div>
      </section>

      <section class="studio-section" id="studio" aria-labelledby="studio-title">
        <div class="section-intro"><p class="eyebrow">Calibration studio</p><h2 id="studio-title">Three sounds. One clear contract.</h2><p>Find a quiet spot and use a comfortable “oo” or hum. Only your thresholds and mappings are saved in this browser.</p></div>
        <div class="studio-grid">
          <div class="listen-panel glass-panel">
            <div class="panel-heading"><div><span class="step-tag">Step 1</span><h3>Listen locally</h3></div><span class="privacy-chip">Audio stays here</span></div>
            <div class="listen-visual">
              <canvas id="pitch-canvas" width="720" height="220" role="img" aria-label="Live pitch trace; the text reading below gives the same information"></canvas>
              <div class="pitch-readout"><span id="note-state">Waiting</span><strong id="pitch-value">— <small>Hz</small></strong><span id="clarity-value">No signal yet</span></div>
              <div class="level-track" aria-hidden="true"><span id="level-fill"></span></div>
            </div>
            <div class="listen-actions"><button class="button primary" id="mic-button" type="button"><span class="mic-dot" aria-hidden="true"></span> Allow microphone</button><button class="button secondary" id="demo-button" type="button">Use demo setup</button></div>
            <p class="status-message" id="mic-status" aria-live="polite">Microphone access starts only when you ask. Headphones can reduce feedback.</p>
          </div>

          <div class="calibrate-panel">
            <div class="panel-heading"><div><span class="step-tag">Step 2</span><h3>Place your gestures</h3></div><span class="sample-count" id="sample-count">0 / 3 ready</span></div>
            <ol class="sample-list">
              <li class="sample-item" data-kind="low"><span class="sample-number">01</span><div><strong>Comfortable low</strong><span>Sing low and steady for 2 seconds.</span></div><output>Not sampled</output><button type="button" class="sample-button" data-sample="low">Sample low</button></li>
              <li class="sample-item" data-kind="high"><span class="sample-number">02</span><div><strong>Comfortable high</strong><span>Move clearly above your low note.</span></div><output>Not sampled</output><button type="button" class="sample-button" data-sample="high">Sample high</button></li>
              <li class="sample-item" data-kind="held"><span class="sample-number">03</span><div><strong>Steady hold</strong><span>Sustain any comfortable note.</span></div><output>Not sampled</output><button type="button" class="sample-button" data-sample="held">Sample hold</button></li>
            </ol>
            <p class="status-message" id="sample-status" aria-live="polite">Start the microphone, then sample in any order.</p>
          </div>
        </div>
      </section>

      <section class="mapping-section" id="map" aria-labelledby="mapping-title">
        <div class="section-intro"><p class="eyebrow">Action patchbay</p><h2 id="mapping-title">Choose what each sound does.</h2><p>The defaults fit the test game. Change any row for your own project; onset means the instant a sound begins, and silence releases held controls.</p></div>
        <div class="mapping-layout">
          <div class="mapping-table" role="group" aria-label="Vocal gesture mappings">
            <div class="mapping-head" aria-hidden="true"><span>Gesture</span><span>Browser action</span><span>Live</span></div>
            <div id="mapping-rows"></div>
          </div>
          <aside class="tuning-panel glass-panel" aria-labelledby="tuning-title">
            <h3 id="tuning-title">Fine tune</h3>
            <label for="split-range">Pitch split <output id="split-output">255 Hz</output></label><input id="split-range" type="range" min="100" max="700" value="255">
            <label for="hold-range">Hold starts after <output id="hold-output">850 ms</output></label><input id="hold-range" type="range" min="400" max="2000" step="50" value="850">
            <label for="noise-range">Room noise gate <output id="noise-output">2%</output></label><input id="noise-range" type="range" min="5" max="100" value="18">
            <button class="text-button" type="button" id="reset-button">Reset setup</button>
          </aside>
        </div>
        <div class="test-strip" aria-labelledby="test-title"><div><span class="step-tag">Quick check</span><h3 id="test-title">Press to preview your output</h3></div><div class="test-buttons"><button type="button" data-test="low">Low</button><button type="button" data-test="high">High</button><button type="button" data-test="held">Hold</button><button type="button" data-test="onset">Onset</button></div></div>
      </section>

      <section class="play-section" id="play" aria-labelledby="play-title">
        <div class="section-intro"><p class="eyebrow">Accessibility test route</p><h2 id="play-title">Fly the glass ferry.</h2><p>Low moves down, high moves up, and a held note adds speed. Use <kbd>↓</kbd>, <kbd>↑</kbd>, and <kbd>Space</kbd> at any time.</p></div>
        <div class="game-shell">
          <div class="game-toolbar"><span><i class="live-light" aria-hidden="true"></i><b id="game-live">Game ready</b></span><span id="game-progress">0 of 3 gates</span></div>
          <canvas id="game-canvas" width="640" height="360" aria-label="Glass ferry game. Guide the ferry through low, high, and hold gates using your mapped controls or keyboard."></canvas>
          <div class="game-footer"><p id="game-status" aria-live="polite">Ready at the first gate.</p><div><button class="button primary compact-button" id="game-toggle" type="button">Start route</button><button class="button secondary compact-button" id="game-reset" type="button">Reset</button></div></div>
        </div>
        <div class="recognition"><span>Session recognition</span><strong id="accuracy">—</strong><p id="accuracy-detail">Start listening to measure detected vocal frames.</p></div>
      </section>

      <section class="connect-section" id="connect" aria-labelledby="connect-title">
        <div class="section-intro"><p class="eyebrow">Output desk</p><h2 id="connect-title">Take the controls with you.</h2><p>Every change dispatches a <code>sing-switch</code> browser event. Export the setup, copy the live state, or stream controller JSON to a WebSocket you control.</p></div>
        <div class="connect-grid">
          <div class="state-panel glass-panel"><div class="panel-heading"><h3>Live controller state</h3><span id="output-state" class="output-badge">Idle</span></div><pre id="state-json" tabindex="0" aria-label="Live JSON controller state"></pre><div class="button-row"><button class="button primary compact-button" id="copy-state" type="button">Copy state</button><button class="button secondary compact-button" id="download-mapping" type="button">Export mapping</button></div><p class="status-message" id="copy-status" aria-live="polite"></p></div>
          <div class="socket-panel"><h3>Optional WebSocket</h3><p>Only controller data is sent—never audio. Start a local receiver, then connect.</p><label for="socket-url">WebSocket address</label><div class="socket-input"><input id="socket-url" type="url" value="ws://localhost:8765" spellcheck="false"><button class="button secondary compact-button" id="socket-button" type="button">Connect</button></div><p class="status-message" id="socket-status" aria-live="polite">Disconnected</p><details><summary>Integration contract</summary><pre><code>window.addEventListener('sing-switch', e =&gt; {
  const { gesture, activeActions } = e.detail;
});</code></pre></details></div>
        </div>
      </section>

      <section class="limits" aria-labelledby="limits-title"><div><p class="eyebrow">Know the edges</p><h2 id="limits-title">A transparent tool, not voice AI.</h2></div><ul><li><strong>Noise matters.</strong><span>Fans, echoes, and other voices can lower accuracy. Raise the noise gate or use a headset.</span></li><li><strong>Every voice differs.</strong><span>Recalibrate after changing rooms or microphones. Use comfortable notes only.</span></li><li><strong>Keep an alternative.</strong><span>Keyboard controls always remain available; production games should preserve another input path.</span></li></ul></section>
    </main>${footer()}`;
}

if (!legalPage) initialiseStudio();

function initialiseStudio(): void {
  let calibration = loadJson<Calibration>('sing-switch-calibration', { ...DEFAULT_CALIBRATION });
  let mappings = loadJson<Mapping[]>('sing-switch-mappings', DEFAULT_MAPPINGS.map((mapping) => ({ ...mapping })));
  const source = new MicrophonePitchSource();
  let listening = false;
  let frame = 0;
  let socket: WebSocket | null = null;
  let previousKeys = new Set<string>();
  let voicedSince: number | null = null;
  let wasVoiced = false;
  let latestResult: PitchResult = { frequency: null, clarity: 0, rms: 0 };
  let samplesReady = new Set<Gesture>(localStorage.getItem('sing-switch-calibration') ? ['low', 'high', 'held'] : []);
  let voicedFrames = 0;
  let recognizedFrames = 0;
  const pitchHistory: Array<number | null> = [];

  const byId = <T extends HTMLElement>(id: string): T => {
    const element = document.getElementById(id) as T | null;
    if (!element) throw new Error(`Missing #${id}`);
    return element;
  };

  const micButton = byId<HTMLButtonElement>('mic-button');
  const micStatus = byId('mic-status');
  const sampleStatus = byId('sample-status');
  const pitchValue = byId('pitch-value');
  const noteState = byId('note-state');
  const clarityValue = byId('clarity-value');
  const levelFill = byId('level-fill');
  const stateJson = byId('state-json');
  const outputState = byId('output-state');
  const canvas = byId<HTMLCanvasElement>('pitch-canvas');
  const context = canvas.getContext('2d');
  const game = new FerryGame(byId<HTMLCanvasElement>('game-canvas'), byId('game-status'), byId('game-progress'), byId('game-live'));

  renderMappings();
  updateTuningControls();
  if (samplesReady.size === 3) {
    updateSample('low', `${calibration.lowHz} Hz`);
    updateSample('high', `${calibration.highHz} Hz`);
    updateSample('held', `${calibration.holdMs} ms`);
    byId('sample-count').textContent = '3 / 3 ready';
    sampleStatus.textContent = 'Saved calibration loaded. You can resample any gesture.';
  }
  emitState(makeState(latestResult, calibration, mappings, null, false).state);
  drawPitch();

  micButton.addEventListener('click', async () => {
    if (listening) {
      await stopListening();
      return;
    }
    micButton.disabled = true;
    micStatus.textContent = 'Requesting microphone access…';
    try {
      await source.start();
      listening = true;
      micButton.disabled = false;
      micButton.classList.add('is-live');
      micButton.innerHTML = '<span class="mic-dot" aria-hidden="true"></span> Stop listening';
      micStatus.textContent = 'Listening locally. Sing a steady note, or begin sampling.';
      frame = requestAnimationFrame(analyse);
    } catch (error) {
      micButton.disabled = false;
      micStatus.textContent = microphoneError(error);
      micButton.focus();
    }
  });

  byId<HTMLButtonElement>('demo-button').addEventListener('click', () => {
    calibration = { ...DEFAULT_CALIBRATION };
    samplesReady = new Set(['low', 'high', 'held']);
    updateSample('low', `${calibration.lowHz} Hz`);
    updateSample('high', `${calibration.highHz} Hz`);
    updateSample('held', `${calibration.holdMs} ms`);
    updateTuningControls();
    saveSettings();
    sampleStatus.textContent = 'Demo setup loaded. Use the preview buttons or keyboard path without a microphone.';
    byId('sample-count').textContent = '3 / 3 ready';
  });

  document.querySelectorAll<HTMLButtonElement>('[data-sample]').forEach((button) => {
    button.addEventListener('click', () => sampleGesture(button.dataset.sample as Gesture, button));
  });

  document.querySelectorAll<HTMLButtonElement>('[data-test]').forEach((button) => {
    const gesture = button.dataset.test as Gesture;
    const end = () => previewGesture('silence');
    button.addEventListener('pointerdown', () => previewGesture(gesture));
    button.addEventListener('pointerup', end);
    button.addEventListener('pointercancel', end);
    button.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') previewGesture(gesture); });
    button.addEventListener('keyup', end);
  });

  byId<HTMLInputElement>('split-range').addEventListener('input', (event) => {
    const split = Number((event.target as HTMLInputElement).value);
    const ratio = Math.max(1.2, Math.sqrt(calibration.highHz / calibration.lowHz));
    calibration.lowHz = Math.round(split / ratio);
    calibration.highHz = Math.round(split * ratio);
    byId<HTMLOutputElement>('split-output').value = `${split} Hz`;
    saveSettings();
  });
  byId<HTMLInputElement>('hold-range').addEventListener('input', (event) => {
    calibration.holdMs = Number((event.target as HTMLInputElement).value);
    byId<HTMLOutputElement>('hold-output').value = `${calibration.holdMs} ms`;
    saveSettings();
  });
  byId<HTMLInputElement>('noise-range').addEventListener('input', (event) => {
    calibration.noiseFloor = Number((event.target as HTMLInputElement).value) / 1000;
    byId<HTMLOutputElement>('noise-output').value = `${Math.round(calibration.noiseFloor * 100)}%`;
    saveSettings();
  });

  byId<HTMLButtonElement>('reset-button').addEventListener('click', () => {
    calibration = { ...DEFAULT_CALIBRATION };
    mappings = DEFAULT_MAPPINGS.map((mapping) => ({ ...mapping }));
    samplesReady.clear();
    localStorage.removeItem('sing-switch-calibration');
    localStorage.removeItem('sing-switch-mappings');
    document.querySelectorAll<HTMLElement>('.sample-item').forEach((item) => { item.classList.remove('is-ready'); item.querySelector('output')!.textContent = 'Not sampled'; });
    byId('sample-count').textContent = '0 / 3 ready';
    renderMappings();
    updateTuningControls();
    sampleStatus.textContent = 'Setup reset. Start listening to sample again.';
  });

  const gameToggle = byId<HTMLButtonElement>('game-toggle');
  gameToggle.addEventListener('click', () => {
    if (game.isRunning) { game.pause(); gameToggle.textContent = 'Resume route'; }
    else { game.start(); gameToggle.textContent = 'Pause route'; }
  });
  byId<HTMLButtonElement>('game-reset').addEventListener('click', () => { game.reset(); gameToggle.textContent = 'Start route'; });
  byId<HTMLCanvasElement>('game-canvas').addEventListener('gamecomplete', () => { gameToggle.textContent = 'Play again'; });
  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'Space'].includes(event.code) && !isTyping(event.target)) {
      event.preventDefault(); game.keyDown(event.code); if (!game.isRunning) { game.start(); gameToggle.textContent = 'Pause route'; }
    }
  });
  window.addEventListener('keyup', (event) => game.keyUp(event.code));

  byId<HTMLButtonElement>('copy-state').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(stateJson.textContent || ''); byId('copy-status').textContent = 'Controller state copied.'; }
    catch { byId('copy-status').textContent = 'Copy was blocked. Select the JSON above and copy it manually.'; }
  });
  byId<HTMLButtonElement>('download-mapping').addEventListener('click', () => {
    const exportData = { product: 'sing-switch', version: 1, calibration, mappings, browserEvent: 'sing-switch' };
    const url = URL.createObjectURL(new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'sing-switch-mapping.json'; link.click(); URL.revokeObjectURL(url);
    byId('copy-status').textContent = 'Mapping exported as JSON.';
  });
  byId<HTMLButtonElement>('socket-button').addEventListener('click', () => toggleSocket());

  const updateNetwork = () => {
    const network = byId('network-state');
    network.innerHTML = `<span aria-hidden="true"></span> ${navigator.onLine ? 'Online' : 'Offline · studio still works'}`;
    network.classList.toggle('is-offline', !navigator.onLine);
  };
  window.addEventListener('online', updateNetwork); window.addEventListener('offline', updateNetwork); updateNetwork();

  async function stopListening(): Promise<void> {
    listening = false;
    cancelAnimationFrame(frame);
    await source.stop();
    micButton.classList.remove('is-live');
    micButton.innerHTML = '<span class="mic-dot" aria-hidden="true"></span> Allow microphone';
    micStatus.textContent = 'Microphone stopped. Your calibration remains in this browser.';
    latestResult = { frequency: null, clarity: 0, rms: 0 };
    const output = makeState(latestResult, calibration, mappings, null, wasVoiced);
    voicedSince = output.voicedSince; wasVoiced = output.voiced; emitState(output.state);
  }

  function analyse(now: number): void {
    if (!listening) return;
    latestResult = source.read(calibration.noiseFloor);
    const output = makeState(latestResult, calibration, mappings, voicedSince, wasVoiced, now);
    voicedSince = output.voicedSince; wasVoiced = output.voiced;
    if (latestResult.frequency !== null) { voicedFrames += 1; if (output.state.activeActions.length) recognizedFrames += 1; }
    pitchHistory.push(latestResult.frequency); if (pitchHistory.length > 90) pitchHistory.shift();
    emitState(output.state); drawPitch(); updateAccuracy();
    frame = requestAnimationFrame(analyse);
  }

  async function sampleGesture(kind: Gesture, button: HTMLButtonElement): Promise<void> {
    if (!listening) { sampleStatus.textContent = 'Allow the microphone first, or load the demo setup.'; micButton.focus(); return; }
    button.disabled = true;
    const item = button.closest<HTMLElement>('.sample-item')!;
    item.classList.add('is-sampling');
    sampleStatus.textContent = kind === 'held' ? 'Keep the sound steady until the ring completes…' : `Listening for your ${kind} note…`;
    const frequencies: number[] = [];
    let continuousStart: number | null = null;
    let longest = 0;
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const timer = window.setInterval(() => {
        const elapsed = performance.now() - start;
        item.style.setProperty('--sample-progress', `${Math.min(100, (elapsed / 1800) * 100)}%`);
        if (latestResult.frequency) { frequencies.push(latestResult.frequency); continuousStart ??= performance.now(); longest = Math.max(longest, performance.now() - continuousStart); }
        else continuousStart = null;
        if (elapsed >= 1800) { clearInterval(timer); resolve(); }
      }, 40);
    });
    item.classList.remove('is-sampling'); button.disabled = false;
    if (frequencies.length < 8 || (kind === 'held' && longest < 900)) {
      sampleStatus.textContent = kind === 'held' ? 'The sound broke too soon. Try a steady note for the full two seconds.' : 'I could not find a steady pitch. Move closer or raise the room noise gate.';
      return;
    }
    if (kind === 'low' || kind === 'high') {
      const value = Math.round(median(frequencies));
      if (kind === 'high' && samplesReady.has('low') && value < calibration.lowHz * 1.15) { sampleStatus.textContent = 'That high note is too close to your low note. Try a clearly higher pitch.'; return; }
      if (kind === 'low' && samplesReady.has('high') && value > calibration.highHz / 1.15) { sampleStatus.textContent = 'That low note is too close to your high note. Try a clearly lower pitch.'; return; }
      calibration[`${kind}Hz`] = value;
      updateSample(kind, `${value} Hz`);
    } else {
      calibration.holdMs = Math.max(600, Math.min(1200, Math.round(longest * 0.55 / 50) * 50));
      updateSample('held', `${Math.round(longest / 100) / 10}s steady`);
    }
    samplesReady.add(kind); byId('sample-count').textContent = `${samplesReady.size} / 3 ready`;
    sampleStatus.textContent = samplesReady.size === 3 ? 'Calibration ready. Preview the controls or fly the test route.' : `${kind[0].toUpperCase()}${kind.slice(1)} sample saved locally.`;
    updateTuningControls(); saveSettings();
  }

  function updateSample(kind: Gesture, text: string): void {
    const item = document.querySelector<HTMLElement>(`.sample-item[data-kind="${kind}"]`)!;
    item.classList.add('is-ready'); item.querySelector('output')!.textContent = `✓ ${text}`;
  }

  function renderMappings(): void {
    const labels: Record<Gesture, string> = { low: 'Low tone', high: 'High tone', held: 'Held note', onset: 'Sound starts', silence: 'Silence' };
    const actions: Array<[ActionId, string]> = [['NONE', 'No action'], ['MOVE_UP', 'Move up'], ['MOVE_DOWN', 'Move down'], ['BOOST', 'Boost / hold'], ['BUTTON_A', 'Button A'], ['BUTTON_B', 'Button B']];
    byId('mapping-rows').innerHTML = mappings.map((mapping) => `<div class="mapping-row" data-gesture="${mapping.gesture}"><label for="map-${mapping.gesture}"><span class="gesture-mark ${mapping.gesture}" aria-hidden="true"></span>${labels[mapping.gesture]}</label><select id="map-${mapping.gesture}">${actions.map(([value, label]) => `<option value="${value}" ${value === mapping.action ? 'selected' : ''}>${label}${ACTION_KEYS[value] ? ` · ${keyLabel(ACTION_KEYS[value])}` : ''}</option>`).join('')}</select><span class="action-light" aria-label="Released">Released</span></div>`).join('');
    document.querySelectorAll<HTMLSelectElement>('.mapping-row select').forEach((select) => select.addEventListener('change', () => {
      const gesture = select.closest<HTMLElement>('.mapping-row')!.dataset.gesture as Gesture;
      const mapping = mappings.find((item) => item.gesture === gesture)!;
      mapping.action = select.value as ActionId; mapping.key = ACTION_KEYS[mapping.action]; saveSettings();
    }));
  }

  function updateTuningControls(): void {
    const split = Math.round(Math.sqrt(calibration.lowHz * calibration.highHz));
    byId<HTMLInputElement>('split-range').value = String(split); byId<HTMLOutputElement>('split-output').value = `${split} Hz`;
    byId<HTMLInputElement>('hold-range').value = String(calibration.holdMs); byId<HTMLOutputElement>('hold-output').value = `${calibration.holdMs} ms`;
    byId<HTMLInputElement>('noise-range').value = String(Math.round(calibration.noiseFloor * 1000)); byId<HTMLOutputElement>('noise-output').value = `${Math.round(calibration.noiseFloor * 100)}%`;
  }

  function saveSettings(): void {
    localStorage.setItem('sing-switch-calibration', JSON.stringify(calibration));
    localStorage.setItem('sing-switch-mappings', JSON.stringify(mappings));
  }

  function previewGesture(gesture: Gesture): void {
    const split = Math.sqrt(calibration.lowHz * calibration.highHz);
    const result: PitchResult = gesture === 'silence' ? { frequency: null, clarity: 0, rms: 0 } : { frequency: gesture === 'low' ? split * 0.8 : split * 1.2, clarity: 0.98, rms: 0.12 };
    const fakeSince = gesture === 'held' ? performance.now() - calibration.holdMs - 10 : performance.now();
    const output = makeState(result, calibration, mappings, fakeSince, gesture !== 'onset');
    emitState(output.state);
  }

  function emitState(state: ControllerState): void {
    stateJson.textContent = JSON.stringify(state, null, 2);
    outputState.textContent = state.activeActions.length ? state.activeActions.join(' + ').replaceAll('_', ' ') : state.gesture === 'silence' ? 'Idle' : 'Listening';
    outputState.classList.toggle('is-active', state.activeActions.length > 0);
    pitchValue.innerHTML = state.pitchHz ? `${Math.round(state.pitchHz)} <small>Hz</small>` : '— <small>Hz</small>';
    noteState.textContent = state.gesture === 'silence' ? 'Quiet' : state.gesture[0].toUpperCase() + state.gesture.slice(1);
    clarityValue.textContent = state.pitchHz ? `${Math.round(state.clarity * 100)}% pitch confidence` : 'Below noise gate';
    levelFill.style.transform = `scaleX(${Math.min(1, state.level * 8)})`;
    document.querySelectorAll<HTMLElement>('.mapping-row').forEach((row) => {
      const rowMapping = mappings.find((mapping) => mapping.gesture === row.dataset.gesture);
      const gestureMatches = row.dataset.gesture === state.gesture || (state.gesture === 'held' && ['low', 'high'].includes(row.dataset.gesture || ''));
      const active = Boolean(gestureMatches && rowMapping && rowMapping.action !== 'NONE' && state.activeActions.includes(rowMapping.action));
      row.classList.toggle('is-active', Boolean(active));
      const label = row.querySelector<HTMLElement>('.action-light')!; label.textContent = active ? 'Pressed' : 'Released'; label.setAttribute('aria-label', active ? 'Pressed' : 'Released');
    });
    game.setActions(state.activeActions);
    window.dispatchEvent(new CustomEvent('sing-switch', { detail: state }));
    const nextKeys = new Set(state.keys);
    previousKeys.forEach((key) => { if (!nextKeys.has(key)) window.dispatchEvent(new KeyboardEvent('keyup', { code: key, key: key === 'Space' ? ' ' : key, bubbles: true })); });
    nextKeys.forEach((key) => { if (!previousKeys.has(key)) window.dispatchEvent(new KeyboardEvent('keydown', { code: key, key: key === 'Space' ? ' ' : key, bubbles: true })); });
    previousKeys = nextKeys;
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(state));
  }

  function drawPitch(): void {
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#0a1714'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = 'rgba(127,255,196,.12)'; context.lineWidth = 1;
    for (let y = 28; y < canvas.height; y += 36) { context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke(); }
    const split = Math.sqrt(calibration.lowHz * calibration.highHz);
    const splitY = canvas.height - Math.min(canvas.height - 15, (split / 700) * canvas.height);
    context.setLineDash([5, 8]); context.strokeStyle = 'rgba(199,168,255,.5)'; context.beginPath(); context.moveTo(0, splitY); context.lineTo(canvas.width, splitY); context.stroke(); context.setLineDash([]);
    if (!pitchHistory.length) {
      context.fillStyle = '#7d9a91'; context.font = '16px system-ui'; context.textAlign = 'center'; context.fillText('Your live pitch landscape will appear here', canvas.width / 2, canvas.height / 2); return;
    }
    context.strokeStyle = '#7fffc4'; context.shadowColor = '#7fffc4'; context.shadowBlur = 10; context.lineWidth = 3; context.beginPath();
    pitchHistory.forEach((pitch, index) => { const x = (index / 89) * canvas.width; const y = pitch ? canvas.height - Math.min(canvas.height - 15, (pitch / 700) * canvas.height) : canvas.height - 10; if (index === 0) context.moveTo(x, y); else context.lineTo(x, y); }); context.stroke(); context.shadowBlur = 0;
  }

  function updateAccuracy(): void {
    const accuracy = voicedFrames ? Math.round((recognizedFrames / voicedFrames) * 100) : 0;
    byId('accuracy').textContent = voicedFrames ? `${accuracy}%` : '—';
    byId('accuracy-detail').textContent = voicedFrames ? `${recognizedFrames} of ${voicedFrames} voiced frames matched an action.` : 'Start listening to measure detected vocal frames.';
  }

  function toggleSocket(): void {
    const button = byId<HTMLButtonElement>('socket-button'); const status = byId('socket-status');
    if (socket) { socket.close(); socket = null; button.textContent = 'Connect'; status.textContent = 'Disconnected by you.'; return; }
    const address = byId<HTMLInputElement>('socket-url').value.trim();
    if (!/^wss?:\/\//i.test(address)) { status.textContent = 'Use an address beginning with ws:// or wss://.'; return; }
    status.textContent = 'Connecting…'; button.disabled = true;
    try {
      socket = new WebSocket(address);
      socket.addEventListener('open', () => { button.disabled = false; button.textContent = 'Disconnect'; status.textContent = 'Connected. Streaming controller JSON.'; });
      socket.addEventListener('error', () => { button.disabled = false; status.textContent = 'Connection failed. Check that the receiver is running and the address is correct.'; });
      socket.addEventListener('close', () => { socket = null; button.disabled = false; button.textContent = 'Connect'; if (status.textContent?.startsWith('Connected')) status.textContent = 'Receiver disconnected.'; });
    } catch { socket = null; button.disabled = false; status.textContent = 'That WebSocket address could not be opened.'; }
  }
}

function loadJson<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}

function keyLabel(code: string): string {
  return code.replace('Arrow', '↑↓'.includes(code) ? '' : '').replace('Key', '');
}

function microphoneError(error: unknown): string {
  if (error instanceof DOMException && error.name === 'NotAllowedError') return 'Microphone access was blocked. Allow it in site settings, or use the demo setup and keyboard path.';
  if (error instanceof DOMException && error.name === 'NotFoundError') return 'No microphone was found. Connect one, or use the demo setup and keyboard path.';
  return 'The microphone could not start. Check your browser permission and try again.';
}

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;
}

if ('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
