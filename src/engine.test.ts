import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CALIBRATION,
  DEFAULT_MAPPINGS,
  detectPitch,
  isCalibration,
  isMappings,
  makeState,
  matchesExpectedAction,
  median,
} from './engine';

function sine(frequency: number, sampleRate = 48000, length = 2048, amplitude = 0.5, phase = 0): Float32Array {
  return Float32Array.from({ length }, (_, index) => Math.sin((2 * Math.PI * frequency * index) / sampleRate + phase) * amplitude);
}

describe('pitch engine', () => {
  it('detects a vocal-range sine wave', () => {
    const result = detectPitch(sine(220), 48000);
    expect(result.frequency).toBeCloseTo(220, 0);
    expect(result.clarity).toBeGreaterThan(0.9);
  });

  it.each([70, 180, 220, 260, 300, 360, 440, 550, 700, 900, 1000])(
    'selects the fundamental for %i Hz across changing buffer phases',
    (frequency) => {
      for (let frame = 0; frame < 20; frame += 1) {
        const result = detectPitch(sine(frequency, 48000, 2048, 0.5, frame * 0.37), 48000);
        expect(result.frequency).not.toBeNull();
        expect(Math.abs((result.frequency as number) - frequency) / frequency).toBeLessThan(0.03);
      }
    },
  );

  it('maps the verifier 260 Hz case to the high action', () => {
    const result = detectPitch(sine(260), 48000);
    const output = makeState(result, DEFAULT_CALIBRATION, DEFAULT_MAPPINGS, 0, true, 100).state;
    expect(output.pitchHz).toBeCloseTo(260, 0);
    expect(output.gesture).toBe('high');
    expect(output.activeActions).toContain('MOVE_UP');
    expect(output.activeActions).not.toContain('MOVE_DOWN');
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

  it('does not credit an action that differs from the route target', () => {
    expect(matchesExpectedAction(['MOVE_DOWN'], 'MOVE_UP')).toBe(false);
    expect(matchesExpectedAction(['MOVE_UP'], 'MOVE_UP')).toBe(true);
  });

  it('rejects structurally invalid saved settings', () => {
    expect(isCalibration({})).toBe(false);
    expect(isCalibration(DEFAULT_CALIBRATION)).toBe(true);
    expect(isMappings({})).toBe(false);
    expect(isMappings(DEFAULT_MAPPINGS)).toBe(true);
    expect(isMappings(DEFAULT_MAPPINGS.map((mapping) => ({ ...mapping, key: 'wrong' })))).toBe(false);
  });
});
