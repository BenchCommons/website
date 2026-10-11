import { describe, expect, it } from 'vitest';
import { bytes, int, percent, seconds } from '../../src/lib/format.js';

describe('format', () => {
  it('prints seconds with 3 significant digits', () => {
    expect(seconds(0.123456)).toBe('0.123 s');
    expect(seconds(12.3456)).toBe('12.3 s');
    expect(seconds(1234.5)).toBe('1,235 s');
    expect(seconds(null)).toBe('—');
  });

  it('prints bytes in binary units with one decimal', () => {
    expect(bytes(512)).toBe('512 B');
    expect(bytes(1024)).toBe('1.0 KB');
    expect(bytes(1536 * 1024)).toBe('1.5 MB');
    expect(bytes(8589934592)).toBe('8.0 GB');
    expect(bytes(null)).toBe('—');
  });

  it('prints a fraction as a percentage', () => {
    expect(percent(0.0123)).toBe('1.2%');
    expect(percent(null)).toBe('—');
  });

  it('prints integers with separators', () => {
    expect(int(100000)).toBe('100,000');
    expect(int(3851.67)).toBe('3,852');
    expect(int(undefined)).toBe('—');
  });
});
