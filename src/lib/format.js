const DASH = '—';
const none = (x) => x === null || x === undefined || Number.isNaN(x);

export function int(x) {
  return none(x) ? DASH : Math.round(x).toLocaleString('en-US');
}

/** Seconds with 3 significant digits; whole seconds with separators from 1,000. */
export function seconds(x) {
  if (none(x)) return DASH;
  return (x >= 1000 ? int(x) : String(Number(x.toPrecision(3)))) + ' s';
}

export function bytes(x) {
  if (none(x)) return DASH;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let v = x;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return i === 0 ? `${v} B` : `${v.toFixed(1)} ${units[i]}`;
}

/** A fraction (0.012) as a percentage (1.2%). */
export function percent(x) {
  return none(x) ? DASH : `${(x * 100).toFixed(1)}%`;
}
