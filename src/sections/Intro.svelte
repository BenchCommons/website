<script>
  let { entry } = $props();
  const BT = 'https://github.com/BenchCommons/benchmark-tool';
  const SF = 'https://github.com/BenchCommons/ssg-frameworks';
</script>

<section class="prose" aria-labelledby="intro-h">
  <h1 id="intro-h">How fast do static site generators build the same site?</h1>
  <p>
    BenchCommons builds one reference website with every static site generator in
    <a href={SF}>ssg-frameworks</a> and times a cold build of each. Every generator renders the same posts, the same
    templates and the same stylesheet, so the differences you see come from the generator and its runtime, not from the
    content.
  </p>

  <h2>Why</h2>
  <p>
    Generator speed is usually quoted from each project's own benchmark, on its own content and hardware. Those numbers
    can't be compared. Here the input, the machine limits and the measurement are fixed and public, and anyone can rerun
    a round from the repository.
  </p>

  <h2>How a round runs</h2>
  <ul>
    <li>Each generator runs in its own container, limited to 4 CPUs and 8 GB of memory with swap off.</li>
    <li>
      A round has four suites by page count: <b>P</b> (50 pages), <b>M</b> (1,000), <b>G</b> (10,000) and <b>GG</b>
      (100,000). Each suite has two cells, with 5 KB and 50 KB posts.
    </li>
    <li>After a warm-up build, every timed run is a cold rebuild. The result is the median of the runs, with the
      coefficient of variation shown next to it.</li>
    <li>A build that runs out of memory, exceeds its timeout or produces output that doesn't match the reference site is
      listed as a failure with its reason, not hidden.</li>
    <li>In suite P, an untimed pass also audits the output: Lighthouse, SEO signals, HTML validity, accessibility,
      links and page weight.</li>
  </ul>

  <h2>Read more</h2>
  <ul>
    <li><a href="{BT}/tree/main/docs/specs/008-benchmark-methodology">Benchmark methodology</a> (BT spec 008)</li>
    <li><a href="{BT}/tree/main/docs/specs/009-output-quality">Output quality audit</a> (BT spec 009)</li>
    <li><a href={SF}>The generators and the reference site</a></li>
    {#if entry}
      <li><a href="{BT}/tree/main/docs/results/{entry.id}">Result files of round {entry.id}</a></li>
    {/if}
  </ul>
</section>
