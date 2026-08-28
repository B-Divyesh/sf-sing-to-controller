export type Gesture = 'silence' | 'onset' | 'low' | 'high' | 'held';
export type ActionId = 'NONE' | 'MOVE_UP' | 'MOVE_DOWN' | 'BOOST' | 'BUTTON_A' | 'BUTTON_B';

export interface Calibration {
  lowHz: number;
  highHz: number;
  holdMs: number;
  noiseFloor: number;
}

export interface Mapping {
  gesture: Gesture;
  action: ActionId;
  key: string;
}

export interface PitchResult {
  frequency: number | null;
  clarity: number;
  rms: number;
}

export interface ControllerState {
  version: 1;
  timestamp: number;
  pitchHz: number | null;
  clarity: number;
  level: number;
  gesture: Gesture;
  activeActions: ActionId[];
  keys: string[];
}

export const DEFAULT_CALIBRATION: Calibration = {
  lowHz: 180,
  highHz: 360,
  holdMs: 850,
  noiseFloor: 0.018,
};

export const DEFAULT_MAPPINGS: Mapping[] = [
  { gesture: 'low', action: 'MOVE_DOWN', key: 'ArrowDown' },
  { gesture: 'high', action: 'MOVE_UP', key: 'ArrowUp' },
  { gesture: 'held', action: 'BOOST', key: 'Space' },
  { gesture: 'onset', action: 'NONE', key: '' },
  { gesture: 'silence', action: 'NONE', key: '' },
];

export const ACTION_KEYS: Record<ActionId, string> = {
  NONE: '',
  MOVE_UP: 'ArrowUp',
  MOVE_DOWN: 'ArrowDown',
  BOOST: 'Space',
  BUTTON_A: 'KeyA',
  BUTTON_B: 'KeyB',
};

/** Autocorrelation pitch detector tuned for monophonic voice (70–1000 Hz). */
export function detectPitch(buffer: Float32Array, sampleRate: number, noiseFloor = 0.018): PitchResult {
  let squareSum = 0;
  for (const sample of buffer) squareSum += sample * sample;
  const rms = Math.sqrt(squareSum / buffer.length);
  if (rms < noiseFloor) return { frequency: null, clarity: 0, rms };

  const minLag = Math.max(2, Math.floor(sampleRate / 1000));
  const maxLag = Math.min(buffer.length - 2, Math.ceil(sampleRate / 70));
  let bestLag = -1;
  let bestCorrelation = 0;
  const correlations = new Float32Array(maxLag + 1);

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let correlation = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < buffer.length - lag; i += 1) {
      const a = buffer[i];
      const b = buffer[i + lag];
      correlation += a * b;
      normA += a * a;
      normB += b * b;
    }
    correlation /= Math.sqrt(normA * normB) || 1;
    correlations[lag] = correlation;
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  if (bestLag < 0 || bestCorrelation < 0.72) return { frequency: null, clarity: bestCorrelation, rms };
  const prev = correlations[bestLag - 1] || bestCorrelation;
  const next = correlations[bestLag + 1] || bestCorrelation;
  const shift = (next - prev) / (2 * (2 * bestCorrelation - prev - next) || 1);
  const frequency = sampleRate / (bestLag + Math.max(-1, Math.min(1, shift)));
  return { frequency, clarity: bestCorrelation, rms };
}

export function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function makeState(
  result: PitchResult,
  calibration: Calibration,
  mappings: Mapping[],
  voicedSince: number | null,
  wasVoiced: boolean,
  now = performance.now(),
): { state: ControllerState; voicedSince: number | null; voiced: boolean } {
  const voiced = result.frequency !== null;
  const startedAt = voiced ? (voicedSince ?? now) : null;
  const duration = startedAt === null ? 0 : now - startedAt;
  const split = Math.sqrt(calibration.lowHz * calibration.highHz);
  const gestures: Gesture[] = [];

  let gesture: Gesture = 'silence';
  if (voiced && !wasVoiced) gesture = 'onset';
  else if (voiced && duration >= calibration.holdMs) gesture = 'held';
  else if (voiced) gesture = (result.frequency as number) < split ? 'low' : 'high';
  gestures.push(gesture);

  // Sustained notes keep their pitch-band direction while adding the hold action.
  if (gesture === 'held') gestures.push((result.frequency as number) < split ? 'low' : 'high');
  const matched = mappings.filter((mapping) => gestures.includes(mapping.gesture) && mapping.action !== 'NONE');
  const activeActions = [...new Set(matched.map((mapping) => mapping.action))];
  const keys = [...new Set(matched.map((mapping) => mapping.key).filter(Boolean))];

  return {
    state: {
      version: 1,
      timestamp: Date.now(),
      pitchHz: result.frequency ? Math.round(result.frequency * 10) / 10 : null,
      clarity: Math.round(result.clarity * 100) / 100,
      level: Math.round(result.rms * 1000) / 1000,
      gesture,
      activeActions,
      keys,
    },
    voicedSince: startedAt,
    voiced,
  };
}

export class MicrophonePitchSource {
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private buffer = new Float32Array(2048);

  async start(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone capture is not supported in this browser.');
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    this.context = new AudioContext();
    await this.context.resume();
    const source = this.context.createMediaStreamSource(this.stream);
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0;
    source.connect(this.analyser);
  }

  read(noiseFloor: number): PitchResult {
    if (!this.analyser || !this.context) return { frequency: null, clarity: 0, rms: 0 };
    this.analyser.getFloatTimeDomainData(this.buffer);
    return detectPitch(this.buffer, this.context.sampleRate, noiseFloor);
  }

  async stop(): Promise<void> {
    this.stream?.getTracks().forEach((track) => track.stop());
    await this.context?.close();
    this.context = null;
    this.stream = null;
    this.analyser = null;
  }
}
