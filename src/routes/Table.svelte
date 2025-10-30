<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { gameStore, players, rounds } from '../stores/gameStore';
  import { peerStore } from '../stores/peerStore';
  import { peerManager } from '../lib/p2p/PeerManager';
  import { MessageType, type Message } from '../lib/game/types';
  import QRDisplay from '../components/QRDisplay.svelte';
  import RoundEntry from '../components/RoundEntry.svelte';
  import BalanceView from '../components/BalanceView.svelte';

  export let tableId: string;

  let currentView: 'qr' | 'round' | 'balance' | 'history' = 'qr';
  let unsubscribe: (() => void)[] = [];

  function navigate(path: string) {
    (window as any).navigate(path);
  }

  onMount(() => {
    // Set up message handlers if not already done
    if ($peerStore.role === 'host') {
      setupHostHandlers();
    }

    // If no players yet and we're not the host, something went wrong
    if ($players.length === 0 && $peerStore.role !== 'host') {
      console.error('No players and not host - redirecting');
      navigate('/');
    }
  });

  function setupHostHandlers() {
    peerManager.onConnection((peerId: string) => {
      console.log('New peer connected:', peerId);
      peerStore.addPeer(peerId);
    });

    peerManager.onMessage((message: Message, fromPeer: string) => {
      handleMessage(message, fromPeer);
    });

    peerManager.onDisconnect((peerId: string) => {
      console.log('Peer disconnected:', peerId);
      peerStore.removePeer(peerId);
      gameStore.setPlayerOnline(peerId, false);
    });
  }

  function handleMessage(message: Message, fromPeer: string) {
    switch (message.type) {
      case MessageType.PLAYER_JOINED:
        if (message.data.player) {
          gameStore.addPlayer(
            message.data.player.id,
            message.data.player.name
          );

          // If we're host, send current state to new player
          if ($peerStore.role === 'host') {
            setTimeout(() => {
              peerManager.send(fromPeer, {
                type: MessageType.STATE_SYNC_RESPONSE,
                timestamp: Date.now(),
                senderId: $peerStore.myPeerId,
                senderVersion: $gameStore.version,
                data: { fullState: $gameStore },
              });

              // Tell other peers about new player
              peerManager.broadcast(message, [fromPeer]);
            }, 100);
          }
        }
        break;

      case MessageType.STATE_SYNC_REQUEST:
        // Send current state to requester
        if ($peerStore.role === 'host') {
          peerManager.send(fromPeer, {
            type: MessageType.STATE_SYNC_RESPONSE,
            timestamp: Date.now(),
            senderId: $peerStore.myPeerId,
            senderVersion: $gameStore.version,
            data: { fullState: $gameStore },
          });
        }
        break;

      case MessageType.ROUND_ADDED:
        if (message.data.round) {
          gameStore.addRound(message.data.round);
          // Broadcast to others if we're host
          if ($peerStore.role === 'host') {
            peerManager.broadcast(message, [fromPeer]);
          }
        }
        break;
    }
  }

  onDestroy(() => {
    unsubscribe.forEach((fn) => fn());
  });

  $: canAddRound = $players.length >= 4;
</script>

<div class="container mx-auto px-4 py-4 max-w-2xl pb-24">
  <!-- Header -->
  <div class="mb-4">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-primary">Schafkopf</h1>
        <p class="text-sm text-base-content/70">
          {$players.length} Spieler • {$rounds.length} Runden
        </p>
      </div>
      <button
        class="btn btn-sm btn-ghost"
        on:click={() => {
          if (confirm('Tisch wirklich verlassen?')) {
            peerManager.disconnect();
            gameStore.reset();
            peerStore.reset();
            navigate('/');
          }
        }}
      >
        Verlassen
      </button>
    </div>
  </div>

  <!-- Tab Navigation -->
  <div class="tabs tabs-boxed mb-4">
    <button
      class="tab"
      class:tab-active={currentView === 'qr'}
      on:click={() => (currentView = 'qr')}
    >
      QR-Code
    </button>
    <button
      class="tab"
      class:tab-active={currentView === 'balance'}
      on:click={() => (currentView = 'balance')}
    >
      Stände
    </button>
    <button
      class="tab"
      class:tab-active={currentView === 'round'}
      on:click={() => (currentView = 'round')}
      disabled={!canAddRound}
    >
      Neue Runde
    </button>
    <button
      class="tab"
      class:tab-active={currentView === 'history'}
      on:click={() => (currentView = 'history')}
    >
      Historie
    </button>
  </div>

  <!-- Content -->
  <div class="space-y-4">
    {#if currentView === 'qr'}
      <QRDisplay {tableId} />

      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h3 class="card-title text-sm">Verbundene Spieler</h3>
          <div class="space-y-2">
            {#if $players.length === 0}
              <p class="text-base-content/50 text-sm">
                Warte auf Spieler...
              </p>
            {:else}
              {#each $players as player}
                <div class="flex items-center gap-3 p-2 bg-base-200 rounded">
                  <div
                    class="w-3 h-3 rounded-full"
                    style="background-color: {player.color}"
                  ></div>
                  <span class="font-medium">{player.name}</span>
                  {#if !player.isOnline}
                    <span class="badge badge-sm">Offline</span>
                  {/if}
                </div>
              {/each}
            {/if}
          </div>

          {#if $players.length < 4}
            <div class="alert alert-info mt-2">
              <span class="text-sm">
                Mindestens 4 Spieler erforderlich
              </span>
            </div>
          {/if}
        </div>
      </div>
    {:else if currentView === 'balance'}
      <BalanceView />
    {:else if currentView === 'round'}
      {#if canAddRound}
        <RoundEntry />
      {:else}
        <div class="alert alert-warning">
          <span>Mindestens 4 Spieler erforderlich</span>
        </div>
      {/if}
    {:else if currentView === 'history'}
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Spiel-Historie</h2>

          {#if $rounds.length === 0}
            <p class="text-base-content/50">Noch keine Runden gespielt</p>
          {:else}
            <div class="space-y-3">
              {#each [...$rounds].reverse() as round, i}
                {@const declarer = $players.find((p) => p.id === round.declarer)}
                {@const partner =
                  round.partner
                    ? $players.find((p) => p.id === round.partner)
                    : null}
                <div class="bg-base-200 rounded-lg p-3">
                  <div class="flex justify-between items-start">
                    <div>
                      <div class="font-semibold">
                        {round.variant.toUpperCase()}
                        {#if round.schneider}
                          • Schneider
                        {/if}
                        {#if round.schwarz}
                          • Schwarz
                        {/if}
                        {#if round.laufende > 0}
                          • {round.laufende} Laufende
                        {/if}
                      </div>
                      <div class="text-sm text-base-content/70">
                        {declarer?.name || 'Unbekannt'}
                        {#if partner}
                          + {partner.name}
                        {/if}
                        {round.won ? 'gewonnen' : 'verloren'}
                      </div>
                      <div class="text-xs text-base-content/50 mt-1">
                        {new Date(round.timestamp).toLocaleTimeString('de-DE')}
                      </div>
                    </div>
                    <div class="text-right">
                      {#each round.transactions as txn}
                        {@const from = $players.find((p) => p.id === txn.from)}
                        {@const to = $players.find((p) => p.id === txn.to)}
                        {#if from && to}
                          <div class="text-xs">
                            {from.name} → {to.name}: {txn.amount}ct
                          </div>
                        {/if}
                      {/each}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
