<script lang="ts">
  import { gameStore, onlinePlayers, settings } from '../stores/gameStore';
  import { peerStore } from '../stores/peerStore';
  import { peerManager } from '../lib/p2p/PeerManager';
  import {
    calculateRoundTransactions,
    calculateLaufendeBonus,
  } from '../lib/game/Calculator';
  import type { GameVariant, Round, RoundInput } from '../lib/game/types';
  import { MessageType } from '../lib/game/types';

  // Form state
  let variant: GameVariant = 'rufspiel';
  let declarer = '';
  let partner = '';
  let won = true;
  let schneider = false;
  let schwarz = false;
  let laufende = 0;

  $: players = $onlinePlayers;
  $: baseRates = $settings.baseRates;
  $: allowLaufende = $settings.allowLaufende;
  $: showPartner = variant === 'rufspiel';

  // Reactive validation
  $: isValid = declarer && (variant !== 'rufspiel' || partner);

  // Reactive preview calculation
  $: preview = isValid ? calculatePreview() : null;

  // Auto-disable schneider if schwarz is checked
  $: if (schwarz) schneider = true;

  const laufendeOptions = [
    { value: 0, label: 'Keine', bonus: 0 },
    { value: 3, label: '3', bonus: 15 },
    { value: 4, label: '4', bonus: 20 },
    { value: 5, label: '5', bonus: 25 },
    { value: 6, label: '6', bonus: 30 },
    { value: 7, label: '7', bonus: 35 },
    { value: 8, label: '8', bonus: 40 },
  ];

  $: selectedLaufende = laufendeOptions.find((opt) => opt.value === laufende);

  function calculatePreview() {
    const input: RoundInput = {
      variant,
      declarer,
      partner: showPartner ? partner : undefined,
      won,
      schneider,
      schwarz,
      laufende,
    };

    const transactions = calculateRoundTransactions(input, players, baseRates);

    // Calculate net changes per player
    const changes = new Map<string, number>();
    transactions.forEach((txn) => {
      changes.set(txn.from, (changes.get(txn.from) || 0) - txn.amount);
      changes.set(txn.to, (changes.get(txn.to) || 0) + txn.amount);
    });

    return Array.from(changes.entries())
      .map(([playerId, amount]) => ({
        player: players.find((p) => p.id === playerId)!,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount); // Winners first
  }

  async function submitRound() {
    if (!isValid) return;

    const input: RoundInput = {
      variant,
      declarer,
      partner: showPartner ? partner : undefined,
      won,
      schneider,
      schwarz,
      laufende,
    };

    const round: Round = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      addedBy: $peerStore.myPeerId,
      variant,
      declarer,
      partner: showPartner ? partner : undefined,
      won,
      schneider,
      schwarz,
      laufende,
      baseAmount: baseRates[variant],
      transactions: calculateRoundTransactions(input, players, baseRates),
      version: $gameStore.version + 1,
    };

    // Add locally
    gameStore.addRound(round);

    // Broadcast to peers
    peerManager.broadcast({
      type: MessageType.ROUND_ADDED,
      timestamp: Date.now(),
      senderId: $peerStore.myPeerId,
      senderVersion: $gameStore.version,
      data: { round },
    });

    // Reset form
    resetForm();
  }

  function resetForm() {
    declarer = '';
    partner = '';
    won = true;
    schneider = false;
    schwarz = false;
    laufende = 0;
  }

  // Reset partner if declarer changes
  $: if (declarer && partner === declarer) {
    partner = '';
  }
</script>

<div class="card bg-base-100 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">Neue Runde</h2>

    <!-- Step 1: Variant Selection -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold">Spielvariante</span>
      </label>
      <div class="grid grid-cols-3 gap-2">
        <button
          class="btn h-16"
          class:btn-primary={variant === 'rufspiel'}
          class:btn-outline={variant !== 'rufspiel'}
          on:click={() => (variant = 'rufspiel')}
        >
          <div class="text-center">
            <div class="font-bold">Rufspiel</div>
            <div class="text-xs opacity-70">5ct</div>
          </div>
        </button>
        <button
          class="btn h-16"
          class:btn-primary={variant === 'wenz'}
          class:btn-outline={variant !== 'wenz'}
          on:click={() => (variant = 'wenz')}
        >
          <div class="text-center">
            <div class="font-bold">Wenz</div>
            <div class="text-xs opacity-70">20ct</div>
          </div>
        </button>
        <button
          class="btn h-16"
          class:btn-primary={variant === 'solo'}
          class:btn-outline={variant !== 'solo'}
          on:click={() => (variant = 'solo')}
        >
          <div class="text-center">
            <div class="font-bold">Solo</div>
            <div class="text-xs opacity-70">20ct</div>
          </div>
        </button>
      </div>
    </div>

    <!-- Step 2: Player Selection -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold">Spieler</span>
      </label>
      <div class="grid grid-cols-2 gap-2">
        {#each players as player}
          <button
            class="btn h-20 flex-col"
            class:btn-primary={declarer === player.id}
            class:btn-outline={declarer !== player.id}
            style={declarer === player.id
              ? `background-color: ${player.color}; border-color: ${player.color}`
              : `border-color: ${player.color}`}
            on:click={() => (declarer = player.id)}
          >
            <div class="text-lg font-bold truncate w-full">{player.name}</div>
            <div class="text-xs opacity-70">{player.balance}ct</div>
          </button>
        {/each}
      </div>
    </div>

    <!-- Step 3: Partner Selection (Rufspiel only) -->
    {#if showPartner}
      <div class="form-control">
        <label class="label">
          <span class="label-text font-semibold">Partner</span>
        </label>
        <div class="grid grid-cols-2 gap-2">
          {#each players.filter((p) => p.id !== declarer) as player}
            <button
              class="btn h-20 flex-col"
              class:btn-primary={partner === player.id}
              class:btn-outline={partner !== player.id}
              style={partner === player.id
                ? `background-color: ${player.color}; border-color: ${player.color}`
                : `border-color: ${player.color}`}
              on:click={() => (partner = player.id)}
            >
              <div class="text-lg font-bold truncate w-full">{player.name}</div>
              <div class="text-xs opacity-70">{player.balance}ct</div>
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Step 4: Outcome -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold">Ergebnis</span>
      </label>
      <div class="grid grid-cols-2 gap-2">
        <button
          class="btn h-14"
          class:btn-success={won}
          class:btn-outline={!won}
          on:click={() => (won = true)}
        >
          ✓ Gewonnen
        </button>
        <button
          class="btn h-14"
          class:btn-error={!won}
          class:btn-outline={won}
          on:click={() => (won = false)}
        >
          ✗ Verloren
        </button>
      </div>
    </div>

    <!-- Step 5: Bonuses -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold">Besonderheiten</span>
      </label>
      <div class="flex gap-4">
        <label class="label cursor-pointer gap-2">
          <input
            type="checkbox"
            class="checkbox checkbox-primary"
            bind:checked={schneider}
            disabled={schwarz}
          />
          <span class="label-text">Schneider (×2)</span>
        </label>
        <label class="label cursor-pointer gap-2">
          <input
            type="checkbox"
            class="checkbox checkbox-primary"
            bind:checked={schwarz}
          />
          <span class="label-text">Schwarz (×3)</span>
        </label>
      </div>
    </div>

    <!-- Step 6: Laufende -->
    {#if allowLaufende}
      <div class="form-control">
        <label class="label">
          <span class="label-text font-semibold">Laufende</span>
          {#if selectedLaufende && selectedLaufende.bonus > 0}
            <span class="label-text-alt text-success font-bold">
              +{selectedLaufende.bonus}ct
            </span>
          {/if}
        </label>
        <select class="select select-bordered" bind:value={laufende}>
          {#each laufendeOptions as option}
            <option value={option.value}>
              {option.label}
              {#if option.bonus > 0}
                (+{option.bonus}ct)
              {/if}
            </option>
          {/each}
        </select>
      </div>
    {/if}

    <!-- Preview -->
    {#if preview && preview.length > 0}
      <div class="divider text-xs">Vorschau</div>
      <div class="bg-base-200 rounded-lg p-3 space-y-1">
        {#each preview as { player, amount }}
          <div class="flex justify-between items-center">
            <span class="font-medium">{player.name}</span>
            <span
              class="badge font-bold"
              class:badge-success={amount > 0}
              class:badge-error={amount < 0}
            >
              {amount > 0 ? '+' : ''}{amount}ct
            </span>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Actions -->
    <div class="card-actions justify-end mt-4">
      <button class="btn btn-ghost" on:click={resetForm}> Abbrechen </button>
      <button class="btn btn-primary" disabled={!isValid} on:click={submitRound}>
        Eintragen
      </button>
    </div>
  </div>
</div>
