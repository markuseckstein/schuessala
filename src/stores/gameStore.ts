import { writable, derived, get } from 'svelte/store';
import type { GameState, Round, Player, GameSettings } from '../lib/game/types';
import { calculateBalances } from '../lib/game/Calculator';

// Default settings
const DEFAULT_SETTINGS: GameSettings = {
  maxRounds: undefined,
  baseRates: {
    rufspiel: 5,
    solo: 20,
    wenz: 20,
  },
  allowLaufende: true,
};

// Player colors (material design colors)
const PLAYER_COLORS = [
  '#1e40af', // blue-800
  '#059669', // emerald-600
  '#dc2626', // red-600
  '#7c3aed', // violet-600
];

// Create initial state
function createInitialState(): GameState {
  return {
    tableId: '',
    createdAt: Date.now(),
    hostId: '',
    version: 0,
    players: [],
    rounds: [],
    settings: DEFAULT_SETTINGS,
  };
}

// Create the writable store
function createGameStore() {
  const { subscribe, set, update } = writable<GameState>(createInitialState());

  return {
    subscribe,
    set,

    // Initialize a new game
    init: (tableId: string, hostId: string) => {
      update((state) => ({
        ...state,
        tableId,
        hostId,
        createdAt: Date.now(),
        version: 0,
      }));
    },

    // Add a player
    addPlayer: (peerId: string, name: string) => {
      update((state) => {
        // Don't add if already exists
        if (state.players.find((p) => p.id === peerId)) {
          return state;
        }

        const player: Player = {
          id: peerId,
          name,
          balance: 0,
          isOnline: true,
          lastSeen: Date.now(),
          color: PLAYER_COLORS[state.players.length % PLAYER_COLORS.length],
          joinedAt: Date.now(),
        };

        return {
          ...state,
          players: [...state.players, player],
          version: state.version + 1,
        };
      });
    },

    // Update player online status
    setPlayerOnline: (peerId: string, isOnline: boolean) => {
      update((state) => ({
        ...state,
        players: state.players.map((p) =>
          p.id === peerId
            ? { ...p, isOnline, lastSeen: Date.now() }
            : p
        ),
      }));
    },

    // Add a round
    addRound: (round: Round) => {
      update((state) => {
        const newRounds = [...state.rounds, round];

        // Recalculate balances
        const balances = calculateBalances(
          newRounds,
          state.players.map((p) => p.id)
        );

        return {
          ...state,
          rounds: newRounds,
          players: state.players.map((p) => ({
            ...p,
            balance: balances.get(p.id) || 0,
          })),
          version: state.version + 1,
        };
      });
    },

    // Set entire game state (for sync)
    setState: (newState: GameState) => {
      set(newState);
    },

    // Update settings
    updateSettings: (settings: Partial<GameSettings>) => {
      update((state) => ({
        ...state,
        settings: { ...state.settings, ...settings },
        version: state.version + 1,
      }));
    },

    // Get current version
    getVersion: () => {
      return get({ subscribe }).version;
    },

    // Reset to initial state
    reset: () => {
      set(createInitialState());
    },
  };
}

export const gameStore = createGameStore();

// Derived stores
export const players = derived(gameStore, ($game) => $game.players);
export const onlinePlayers = derived(gameStore, ($game) =>
  $game.players.filter((p) => p.isOnline)
);
export const rounds = derived(gameStore, ($game) => $game.rounds);
export const settings = derived(gameStore, ($game) => $game.settings);
