<script>
  // Sortable table. Columns: {key, label, value(row), format?(v,row), left?}. Empty values sort last.
  let { columns, rows, sort: initial, caption } = $props();

  let sort = $state(initial ?? { key: columns[0].key, dir: 1 });

  const sorted = $derived.by(() => {
    const col = columns.find((c) => c.key === sort.key) ?? columns[0];
    const v = (r) => col.value(r);
    return [...rows].sort((a, b) => {
      const x = v(a);
      const y = v(b);
      const xe = x === null || x === undefined;
      const ye = y === null || y === undefined;
      if (xe || ye) return xe === ye ? 0 : xe ? 1 : -1;
      return (typeof x === 'string' ? x.localeCompare(y) : x - y) * sort.dir;
    });
  });

  function by(key) {
    sort = { key, dir: sort.key === key ? -sort.dir : 1 };
  }
</script>

<div class="table-wrap">
  <table>
    {#if caption}<caption class="visually-hidden">{caption}</caption>{/if}
    <thead>
      <tr>
        {#each columns as c (c.key)}
          <th
            class:l={c.left}
            scope="col"
            tabindex="0"
            aria-sort={sort.key === c.key ? (sort.dir > 0 ? 'ascending' : 'descending') : 'none'}
            onclick={() => by(c.key)}
            onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), by(c.key))}
          >{c.label}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each sorted as r, i (r.framework ?? i)}
        <tr>
          {#each columns as c (c.key)}
            {@const v = c.value(r)}
            <td class:l={c.left}>{c.format ? c.format(v, r) : v ?? '—'}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
