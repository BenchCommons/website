import { describe, expect, it } from 'vitest';
import { classify } from '../../scripts/lib/classify.mjs';

describe('classify', () => {
  it.each(['oom', 'timeout', 'nonconformant', 'unsupported'])('returns the status %s as the kind', (status) => {
    expect(classify({ status, failureReason: 'whatever exited 134' })).toBe(status);
  });

  it.each(['build exited 134', 'deno exited 133 (trap)'])('treats "%s" as a heap abort', (failureReason) => {
    expect(classify({ status: 'failed', failureReason })).toBe('heap');
  });

  it('does not match exit codes that only start with 134', () => {
    expect(classify({ status: 'failed', failureReason: 'exited 1340' })).toBe('error');
  });

  it('returns error for any other reason', () => {
    expect(classify({ status: 'failed', failureReason: 'Java heap space' })).toBe('error');
  });

  it('returns error for an empty reason', () => {
    expect(classify({ status: 'failed', failureReason: '' })).toBe('error');
  });
});
