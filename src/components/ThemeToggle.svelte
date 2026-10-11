<script>
  // Cycles auto → light → dark. The choice is a per-reader convenience kept in localStorage.
  const NEXT = { auto: 'light', light: 'dark', dark: 'auto' };
  const LABEL = { auto: 'Theme: auto', light: 'Theme: light', dark: 'Theme: dark' };

  function read() {
    try {
      return localStorage.getItem('theme') || 'auto';
    } catch {
      return 'auto';
    }
  }

  let theme = $state(read());

  $effect(() => {
    if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // storage blocked: the theme still applies for this visit
    }
  });
</script>

<button class="btn" type="button" data-testid="theme-toggle" onclick={() => (theme = NEXT[theme])}>{LABEL[theme]}</button>
