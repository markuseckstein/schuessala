<script lang="ts">
  import { peerManager } from '../lib/p2p/PeerManager';
  import { gameStore } from '../stores/gameStore';
  import { peerStore } from '../stores/peerStore';
  import { getPlayerName, savePlayerName } from '../lib/storage/localStorage';

  let playerName = getPlayerName() || '';
  let joinCode = '';
  let isCreating = false;
  let isJoining = false;
  let error = '';

  function navigate(path: string) {
    (window as any).navigate(path);
  }

  async function createTable() {
    if (!playerName.trim()) {
      error = 'Bitte gib deinen Namen ein';
      return;
    }

    isCreating = true;
    error = '';

    try {
      // Save name for next time
      savePlayerName(playerName.trim());

      // Create table via PeerJS
      const tableId = await peerManager.createTable();
      const myPeerId = peerManager.getMyPeerId();

      // Initialize stores
      gameStore.init(tableId, myPeerId);
      peerStore.initAsHost(tableId, myPeerId);

      // Add self as first player
      gameStore.addPlayer(myPeerId, playerName.trim());

      // Navigate to table view
      navigate(`/table/${tableId}`);
    } catch (err) {
      console.error('Failed to create table:', err);
      error = 'Fehler beim Erstellen des Tisches';
    } finally {
      isCreating = false;
    }
  }

  async function joinTable() {
    if (!playerName.trim()) {
      error = 'Bitte gib deinen Namen ein';
      return;
    }

    if (!joinCode.trim()) {
      error = 'Bitte gib den Tisch-Code ein';
      return;
    }

    isJoining = true;
    error = '';

    try {
      savePlayerName(playerName.trim());

      // Format table ID
      let tableId = joinCode.trim().toUpperCase();
      if (!tableId.startsWith('GAME-')) {
        tableId = `GAME-${tableId}`;
      }

      // Navigate to join view
      navigate(`/join/${tableId}?name=${encodeURIComponent(playerName.trim())}`);
    } catch (err) {
      console.error('Join error:', err);
      error = 'Fehler beim Beitreten';
    } finally {
      isJoining = false;
    }
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-md">
  <div class="text-center mb-8">
    <h1 class="text-4xl font-bold text-primary mb-2">🃏 Schafkopf</h1>
    <p class="text-base-content/70">Peer-to-Peer Zahlungs-Tracker</p>
  </div>

  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Willkommen!</h2>

      <!-- Player Name -->
      <div class="form-control">
        <label class="label" for="playerName">
          <span class="label-text font-semibold">Dein Name</span>
        </label>
        <input
          id="playerName"
          type="text"
          placeholder="z.B. Hans"
          class="input input-bordered"
          bind:value={playerName}
          maxlength="20"
        />
      </div>

      <!-- Error message -->
      {#if error}
        <div class="alert alert-error">
          <span>{error}</span>
        </div>
      {/if}

      <div class="divider">ODER</div>

      <!-- Join Code -->
      <div class="form-control">
        <label class="label" for="joinCode">
          <span class="label-text font-semibold">Tisch-Code</span>
        </label>
        <input
          id="joinCode"
          type="text"
          placeholder="z.B. A7K9"
          class="input input-bordered font-mono uppercase"
          bind:value={joinCode}
          maxlength="9"
          on:input={(e) => {
            joinCode = e.currentTarget.value.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
          }}
        />
      </div>

      <!-- Actions -->
      <div class="card-actions flex-col gap-2 mt-4">
        <button
          class="btn btn-primary btn-block"
          on:click={createTable}
          disabled={isCreating || !playerName.trim()}
        >
          {#if isCreating}
            <span class="loading loading-spinner"></span>
            Erstelle...
          {:else}
            Neuen Tisch erstellen
          {/if}
        </button>

        <button
          class="btn btn-outline btn-block"
          on:click={joinTable}
          disabled={isJoining || !playerName.trim() || !joinCode.trim()}
        >
          {#if isJoining}
            <span class="loading loading-spinner"></span>
            Trete bei...
          {:else}
            Tisch beitreten
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Info -->
  <div class="mt-6 text-center text-sm text-base-content/60">
    <p>Keine Registrierung erforderlich</p>
    <p>Alle Daten bleiben auf deinen Geräten</p>
  </div>
</div>
