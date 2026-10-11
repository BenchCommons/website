// Composite view (spec R-12): rank per cell, ordered by cells completed, then by the
// geometric mean of rank / okCount over completed cells. The score orders rows; it is never shown.
const EPS = 1e-12;

export function composite(round, suiteOrder) {
  const columns = [];
  const cells = {};
  for (const s of suiteOrder) {
    for (const c of round.suites[s]?.cells ?? []) {
      const key = `${s}/${c.id}`;
      columns.push({ key, suite: s, cell: c.id, okCount: c.ok.length });
      cells[key] = c;
    }
  }
  const rows = Object.keys(round.generators).map((framework) => {
    const out = {};
    let completed = 0;
    let logSum = 0;
    for (const col of columns) {
      const c = cells[col.key];
      const ok = c.ok.find((r) => r.framework === framework);
      if (ok) {
        out[col.key] = { rank: ok.rank, median: ok.median };
        completed += 1;
        logSum += Math.log(ok.rank / col.okCount);
      } else {
        const f = c.failed.find((r) => r.framework === framework);
        out[col.key] = { kind: f ? f.kind : 'missing' };
      }
    }
    return { framework, cells: out, completed, score: completed ? Math.exp(logSum / completed) : null };
  });
  rows.sort((a, b) => {
    if (a.completed !== b.completed) return b.completed - a.completed;
    if (a.score !== null && b.score !== null && Math.abs(a.score - b.score) > EPS) return a.score - b.score;
    return a.framework < b.framework ? -1 : 1;
  });
  return { columns, rows };
}
