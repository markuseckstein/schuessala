<script lang="ts">
  import { onMount } from 'svelte';
  import { peerManager } from '../lib/p2p/PeerManager';
  import { gameStore } from '../stores/gameStore';
  import { peerStore } from '../stores/peerStore';
  import { MessageType, type Message } from '../lib/game/types';
  import { getPlayerName, savePlayerName } from '../lib/storage/localStorage';

  export let tableId: string;

  let playerName = '';
  let isJoining = false;
  let error = '';
  let joined = false;

  function navigate(path: string) {
    (window as any).navigate(path);
  }

  onMount(() => {
    // Try to get player name from URL params
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const nameParam = params.get('name');

    if (nameParam) {
      playerName = nameParam;
      // Auto-join if name provided
      setTimeout(joinTable, 500);
    } else {
      playerName = getPlayerName() || '';
    }
  });

  async function joinTable() {
    if (!playerName.trim()) {
      error = 'Bitte gib deinen Namen ein';
      return;
    }

    isJoining = true;
    error = '';

    try {
      savePlayerName(playerName.trim());

      // Join via PeerJS
      await peerManager.joinTable(tableId);
      const myPeerId = peerManager.getMyPeerId();

      // Initialize stores
      peerStore.initAsPeer(tableId, myPeerId, tableId);

      // Set up message handler
      peerManager.onMessage((message: Message, fromPeer: string) => {
        handleMessage(message, fromPeer);
      });

      peerManager.onConnection((peerId: string) => {
        peerStore.addPeer(peerId);

        // If connecting to host, send player info
        if (peerId === tableId) {
          peerManager.send(peerId, {
            type: MessageType.PLAYER_JOINED,
            timestamp: Date.now(),
            senderId: myPeerId,
            senderVersion: 0,
            data: {
              player: {
                id: myPeerId,
                name: playerName.trim(),
                balance: 0,
                isOnline: true,
                lastSeen: Date.now(),
                color: '',
                joinedAt: Date.now(),
              },
            },
          });

          // Request full state sync
          peerManager.send(peerId, {
            type: MessageType.STATE_SYNC_REQUEST,
            timestamp: Date.now(),
            senderId: myPeerId,
            senderVersion: 0,
            data: {},
          });
        }
      });

      peerManager.onDisconnect((peerId: string) => {
        peerStore.removePeer(peerId);
        gameStore.setPlayerOnline(peerId, false);
      });

      joined = true;

      // Navigate to table after successful join
      setTimeout(() => {
        navigate(`/table/${tableId}`);
      }, 1000);
    } catch (err) {
      console.error('Failed to join table:', err);
      error = 'Fehler beim Beitreten. Ist der Code korrekt?';
      isJoining = false;
    }
  }

  function handleMessage(message: Message, fromPeer: string) {
    switch (message.type) {
      case MessageType.STATE_SYNC_RESPONSE:
        // Received full game state
        gameStore.setState(message.data.fullState || message.data);
        break;

      case MessageType.PLAYER_JOINED:
        if (message.data.player) {
          gameStore.addPlayer(
            message.data.player.id,
            message.data.player.name
          );
        }
        break;

      case MessageType.ROUND_ADDED:
        if (message.data.round) {
          gameStore.addRound(message.data.round);
        }
        break;
    }
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-md">
  <div class="text-center mb-8">
    <h1 class="text-3xl font-bold text-primary mb-2">Tisch beitreten</h1>
    <p class="text-base-content/70 font-mono">{tableId}</p>
  </div>

  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      {#if !joined}
        <h2 class="card-title">Fast geschafft!</h2>

        <div class="form-control">
          <label class="label" for="name">
            <span class="label-text font-semibold">Dein Name</span>
          </label>
          <input
            id="name"
            type="text"
            placeholder="z.B. Max"
            class="input input-bordered"
            bind:value={playerName}
            maxlength="20"
            on:keydown={(e) => e.key === 'Enter' && joinTable()}
          />
        </div>

        {#if error}
          <div class="alert alert-error">
            <span>{error}</span>
          </div>
        {/if}

        <div class="card-actions justify-end mt-4">
          <button
            class="btn btn-ghost"
            on:click={() => navigate('/')}
          >
            Abbrechen
          </button>
          <button
            class="btn btn-primary"
            on:click={joinTable}
            disabled={isJoining || !playerName.trim()}
          >
            {#if isJoining}
              <span class="loading loading-spinner"></span>
              Trete bei...
            {:else}
              Beitreten
            {/if}
          </button>
        </div>
      {:else}
        <div class="text-center py-8">
          <div class="text-6xl mb-4">✅</div>
          <h3 class="text-xl font-bold">Erfolgreich beigetreten!</h3>
          <p class="text-base-content/70 mt-2">
            Warte auf andere Spieler...
          </p>
        </div>
      {/if}
    </div>
  </div>
</div>
