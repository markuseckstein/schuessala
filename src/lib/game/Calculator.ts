import type { Player, RoundInput, Transaction, GameSettings } from './types';

/**
 * Calculate Laufende bonus
 * Formula: bonus = laufende × 5ct
 *
 * Examples:
 * - 3 laufende: 15ct
 * - 4 laufende: 20ct
 * - 5 laufende: 25ct
 * - 6 laufende: 30ct
 * - 7 laufende: 35ct
 * - 8 laufende: 40ct
 */
export function calculateLaufendeBonus(laufende: number): number {
  if (laufende < 3) return 0;
  return laufende * 5;
}

/**
 * Calculate transactions for a round
 */
export function calculateRoundTransactions(
  input: RoundInput,
  players: Player[],
  baseRates: GameSettings['baseRates']
): Transaction[] {
  // Step 1: Get base rate
  const baseRate = baseRates[input.variant];

  // Step 2: Apply Schneider/Schwarz multiplier
  let multiplier = 1;
  if (input.schwarz) {
    multiplier = 3;
  } else if (input.schneider) {
    multiplier = 2;
  }

  // Step 3: Calculate laufende bonus
  const laufendeBonus = calculateLaufendeBonus(input.laufende);

  // Step 4: Final amount per transaction
  const amount = baseRate * multiplier + laufendeBonus;

  // Step 5: Determine who pays whom
  if (input.variant === 'rufspiel') {
    return calculateRufspielTransactions(input, amount, players);
  } else {
    return calculateSoloTransactions(input, amount, players);
  }
}

/**
 * Calculate transactions for Solo or Wenz
 * One player vs three others
 */
function calculateSoloTransactions(
  input: RoundInput,
  amount: number,
  players: Player[]
): Transaction[] {
  const opponents = players.filter((p) => p.id !== input.declarer);
  const transactions: Transaction[] = [];

  if (input.won) {
    // Declarer wins: gets amount from each opponent
    opponents.forEach((opponent) => {
      transactions.push({
        from: opponent.id,
        to: input.declarer,
        amount,
      });
    });
  } else {
    // Declarer loses: pays amount to each opponent
    opponents.forEach((opponent) => {
      transactions.push({
        from: input.declarer,
        to: opponent.id,
        amount,
      });
    });
  }

  return transactions;
}

/**
 * Calculate transactions for Rufspiel
 * Two players vs two others
 */
function calculateRufspielTransactions(
  input: RoundInput,
  amount: number,
  players: Player[]
): Transaction[] {
  const team = [input.declarer, input.partner!];
  const opponents = players.filter((p) => !team.includes(p.id));
  const transactions: Transaction[] = [];

  if (input.won) {
    // Each team member gets amount from each opponent
    team.forEach((winner) => {
      opponents.forEach((loser) => {
        transactions.push({
          from: loser,
          to: winner,
          amount,
        });
      });
    });
  } else {
    // Each team member pays amount to each opponent
    team.forEach((loser) => {
      opponents.forEach((winner) => {
        transactions.push({
          from: loser,
          to: winner,
          amount,
        });
      });
    });
  }

  return transactions;
}

/**
 * Calculate balances from a list of rounds
 */
export function calculateBalances(
  rounds: Round[],
  playerIds: string[]
): Map<string, number> {
  const balances = new Map<string, number>();

  // Initialize all players with 0 balance
  playerIds.forEach((id) => balances.set(id, 0));

  // Apply all transactions
  rounds.forEach((round) => {
    round.transactions.forEach((txn) => {
      // Subtract from payer
      const fromBalance = balances.get(txn.from) || 0;
      balances.set(txn.from, fromBalance - txn.amount);

      // Add to receiver
      const toBalance = balances.get(txn.to) || 0;
      balances.set(txn.to, toBalance + txn.amount);
    });
  });

  return balances;
}

/**
 * Optimize settlement to minimize number of transactions
 * Uses greedy algorithm to match largest creditor with largest debtor
 */
export function optimizeSettlement(
  balances: Map<string, number>
): Transaction[] {
  // Separate creditors (positive) and debtors (negative)
  const creditors: Array<{ id: string; amount: number }> = [];
  const debtors: Array<{ id: string; amount: number }> = [];

  balances.forEach((balance, playerId) => {
    if (balance > 0) {
      creditors.push({ id: playerId, amount: balance });
    } else if (balance < 0) {
      debtors.push({ id: playerId, amount: -balance });
    }
  });

  // Sort by amount (largest first)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions: Transaction[] = [];
  let i = 0,
    j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const amount = Math.min(creditor.amount, debtor.amount);

    transactions.push({
      from: debtor.id,
      to: creditor.id,
      amount,
    });

    creditor.amount -= amount;
    debtor.amount -= amount;

    if (creditor.amount === 0) i++;
    if (debtor.amount === 0) j++;
  }

  return transactions;
}

// Import Round type for calculateBalances
import type { Round } from './types';
