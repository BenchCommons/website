// Labels for failure kinds (spec R-5), shared by Results, Composite and the filter panel.
export const KIND_LABEL = {
  ok: 'completed',
  oom: 'out of memory',
  heap: 'heap limit',
  timeout: 'timeout',
  error: 'build error',
  missing: 'no result',
  nonconformant: 'nonconformant',
  unsupported: 'unsupported',
};

export const KIND_HELP = {
  oom: 'The kernel killed the build at the 8 GB container limit.',
  heap: 'The runtime aborted at its own heap cap (V8, .NET or Deno).',
  timeout: "The build didn't finish within the suite timeout.",
  error: 'The build exited with an error.',
  missing: 'The generator ran in this round but has no result for this cell.',
  nonconformant: "The output doesn't match the reference site.",
  unsupported: "The generator can't build this cell.",
};
