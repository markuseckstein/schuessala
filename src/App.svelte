<script lang="ts">
  import Home from './routes/Home.svelte';
  import Table from './routes/Table.svelte';
  import Join from './routes/Join.svelte';

  // Simple hash-based routing
  let currentRoute: 'home' | 'table' | 'join' = 'home';
  let routeParams: Record<string, string> = {};

  function parseRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const [path, ...rest] = hash.split('/').filter(Boolean);

    if (path === 'table') {
      currentRoute = 'table';
      routeParams = { id: rest[0] || '' };
    } else if (path === 'join') {
      currentRoute = 'join';
      routeParams = { id: rest[0] || '' };
    } else {
      currentRoute = 'home';
      routeParams = {};
    }
  }

  // Navigate function
  export function navigate(path: string) {
    window.location.hash = path;
  }

  // Make navigate globally available
  (window as any).navigate = navigate;

  // Listen to hash changes
  window.addEventListener('hashchange', parseRoute);
  parseRoute(); // Initial parse
</script>

<main class="min-h-screen bg-base-200">
  {#if currentRoute === 'home'}
    <Home />
  {:else if currentRoute === 'table'}
    <Table tableId={routeParams.id} />
  {:else if currentRoute === 'join'}
    <Join tableId={routeParams.id} />
  {/if}
</main>
