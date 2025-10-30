<script lang="ts">
  import { onMount } from 'svelte';
  import QRCodeStyling from 'qr-code-styling';

  export let tableId: string;

  let qrContainer: HTMLDivElement;
  let showCopied = false;

  const baseUrl = window.location.origin + window.location.pathname;
  const joinUrl = `${baseUrl}#/join/${tableId}`;
  const shortCode = tableId.replace('GAME-', '');

  const qrCode = new QRCodeStyling({
    width: 280,
    height: 280,
    data: joinUrl,
    margin: 10,
    dotsOptions: {
      color: '#1e40af',
      type: 'rounded',
    },
    cornersSquareOptions: {
      type: 'extra-rounded',
      color: '#1e40af',
    },
    cornersDotOptions: {
      type: 'dot',
      color: '#1e40af',
    },
    backgroundOptions: {
      color: '#ffffff',
    },
  });

  onMount(() => {
    qrCode.append(qrContainer);
  });

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      showCopied = true;
      setTimeout(() => (showCopied = false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
</script>

<div class="card bg-base-100 shadow-lg">
  <div class="card-body items-center">
    <h3 class="card-title text-sm">Spieler einladen</h3>

    <div bind:this={qrContainer} class="bg-white p-2 rounded-lg"></div>

    <div class="text-center mt-2">
      <p class="text-sm text-base-content/70">Code:</p>
      <p class="text-2xl font-mono font-bold text-primary">{shortCode}</p>
    </div>

    <button class="btn btn-sm btn-outline" on:click={copyLink}>
      {#if showCopied}
        ✓ Kopiert!
      {:else}
        Link kopieren
      {/if}
    </button>
  </div>
</div>
