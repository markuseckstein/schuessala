<script lang="ts">
  import { players } from '../stores/gameStore';
  import { optimizeSettlement } from '../lib/game/Calculator';

  $: sortedPlayers = [...$players].sort((a, b) => b.balance - a.balance);

  $: balances = new Map($players.map((p) => [p.id, p.balance]));
  $: settlements = optimizeSettlement(balances);

  let showSettlement = false;
</script>

<div class="card bg-base-100 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">Aktuelle Stände</h2>

    <div class="space-y-2">
      {#each sortedPlayers as player}
        <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
          <div class="flex items-center gap-3">
            <div
              class="w-3 h-3 rounded-full"
              style="background-color: {player.color}"
            ></div>
            <div>
              <div class="font-semibold">{player.name}</div>
              {#if !player.isOnline}
                <div class="text-xs opacity-50">Offline</div>
              {/if}
            </div>
          </div>
          <div
            class="text-xl font-bold"
            class:text-success={player.balance > 0}
            class:text-error={player.balance < 0}
          >
            {player.balance > 0 ? '+' : ''}{player.balance}ct
          </div>
        </div>
      {/each}
    </div>

    <!-- Settlement optimization -->
    {#if settlements.length > 0}
      <div class="divider"></div>
      <button
        class="btn btn-sm btn-outline"
        on:click={() => (showSettlement = !showSettlement)}
      >
        {showSettlement ? 'Ausgleich ausblenden' : 'Ausgleich anzeigen'}
      </button>

      {#if showSettlement}
        <div class="bg-base-200 rounded-lg p-3 space-y-2">
          <h3 class="font-semibold text-sm">Optimierter Ausgleich:</h3>
          {#each settlements as settlement}
            {@const from = $players.find((p) => p.id === settlement.from)}
            {@const to = $players.find((p) => p.id === settlement.to)}
            {#if from && to}
              <div class="flex items-center gap-2 text-sm">
                <span class="font-medium">{from.name}</span>
                <span>→</span>
                <span class="font-medium">{to.name}</span>
                <span class="ml-auto badge badge-primary">
                  {settlement.amount}ct
                </span>
              </div>
            {/if}
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>
