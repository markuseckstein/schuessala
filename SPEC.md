# Schafkopf P2P App - Technical Specification

## Game Calculation Logic - CORRECTED

### Laufende Calculation

```typescript
/**
 * Laufende (sequential trumps) adds bonus to base price
 *
 * Value  | Meaning                    | Bonus
 * -------|----------------------------|--------
 *   0    | No laufende                | +0ct
 *   3    | 3 sequential trumps        | +15ct
 *   4    | 4 sequential trumps        | +20ct
 *   5    | 5 sequential trumps        | +25ct
 *   6    | 6 sequential trumps        | +30ct
 *   7    | 7 sequential trumps        | +35ct
 *   8    | 8 sequential trumps (max)  | +40ct
 *
 * Formula: bonus = laufende × 5ct
 */
function calculateLaufendeBonus(laufende: number): number {
  if (laufende < 3) return 0;
  return laufende * 5;
}
```

## Round Entry UI Design - UPDATED

### Player Selection with Toggle Buttons

```svelte
<!-- Player Selection - Using Toggle Buttons instead of Dropdowns -->
<div class="form-control">
  <label class="label">
    <span class="label-text font-semibold">Spieler</span>
  </label>
  <div class="grid grid-cols-2 gap-2">
    {#each players.filter(p => p.isOnline) as player}
      <button
        class="btn btn-lg h-20"
        class:btn-primary={declarer === player.id}
        class:btn-outline={declarer !== player.id}
        style="border-color: {player.color}; {declarer === player.id ? `background-color: ${player.color}` : ''}"
        on:click={() => declarer = player.id}
      >
        <div class="text-center">
          <div class="text-lg font-bold">{player.name}</div>
          <div class="text-xs opacity-70">{player.balance}ct</div>
        </div>
      </button>
    {/each}
  </div>
</div>

{#if showPartner}
  <div class="form-control">
    <label class="label">
      <span class="label-text font-semibold">Partner</span>
    </label>
    <div class="grid grid-cols-2 gap-2">
      {#each players.filter(p => p.isOnline && p.id !== declarer) as player}
        <button
          class="btn btn-lg h-20"
          class:btn-primary={partner === player.id}
          class:btn-outline={partner !== player.id}
          style="border-color: {player.color}; {partner === player.id ? `background-color: ${player.color}` : ''}"
          on:click={() => partner = player.id}
        >
          <div class="text-center">
            <div class="text-lg font-bold">{player.name}</div>
            <div class="text-xs opacity-70">{player.balance}ct</div>
          </div>
        </button>
      {/each}
    </div>
  </div>
{/if}
```

### Laufende Options - CORRECTED

```typescript
const laufendeOptions = [
  { value: 0, label: 'Keine', bonus: 0 },
  { value: 3, label: '3', bonus: 15 },
  { value: 4, label: '4', bonus: 20 },
  { value: 5, label: '5', bonus: 25 },
  { value: 6, label: '6', bonus: 30 },
  { value: 7, label: '7', bonus: 35 },
  { value: 8, label: '8', bonus: 40 },
];
```

## Full Specification

See implementation for complete details including:
- P2P Architecture with WebRTC
- Host Election & Reconnection
- Error Handling & State Sync
- Complete Game Logic
- All UI Components
