import { describe, expect, it } from 'vitest';
import { DEFAULT_CALIBRATION, DEFAULT_MAPPINGS, detectPitch, makeState, median } from './engine';

function sine(frequency: number, sampleRate = 48000, length = 2048, amplitude = 0.5): Float32Array {
  return Float32Array.from({ length }, (_, index) => Math.sin((2 * Math.PI * frequency * index) / sampleRate) * amplitude);
}

describe('pitch engine', () => {
  it('detects a vocal-range sine wave', () => {
    const result = detectPitch(sine(220), 48000);
    expect(result.frequency).toBeCloseTo(220, 0);
    expect(result.clarity).toBeGreaterThan(0.9);
  });

  it('treats a quiet buffer as silence', () => {
    expect(detectPitch(new Float32Array(2048), 48000).frequency).toBeNull();
  });

  it('uses a robust median for calibration', () => {
    expect(median([181, 179, 180, 700])).toBe(180.5);
  });

  it('combines pitch and hold mappings for sustained notes', () => {
    const result = { frequency: 175, clarity: 0.95, rms: 0.1 };
    const output = makeState(result, DEFAULT_CALIBRATION, DEFAULT_MAPPINGS, 0, true, 1000).state;
    expect(output.gesture).toBe('held');
    expect(output.activeActions).toEqual(expect.arrayContaining(['BOOST', 'MOVE_DOWN']));
  });
});
