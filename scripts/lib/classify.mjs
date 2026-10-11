const DIRECT = new Set(['oom', 'timeout', 'nonconformant', 'unsupported']);

/** Failure kind of a non-ok suite-summary row (spec R-5). */
export function classify(row) {
  if (DIRECT.has(row.status)) return row.status;
  const reason = row.failureReason || '';
  if (/exited 13[34]\b/.test(reason)) return 'heap';
  return 'error';
}
