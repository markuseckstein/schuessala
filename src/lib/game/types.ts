// Game variant types
export type GameVariant = 'rufspiel' | 'solo' | 'wenz';

// Connection status
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

// Peer role
export type PeerRole = 'host' | 'peer';

// Player interface
export interface Player {
  id: string; // Peer ID
  name: string;
  balance: number; // Running total in cents
  isOnline: boolean;
  lastSeen: number;
  color: string; // Hex color for UI
  joinedAt: number;
}

// Round interface
export interface Round {
  id: string; // UUID
  timestamp: number;
  addedBy: string; // Peer ID who added it
  variant: GameVariant;
  declarer: string;
  partner?: string; // Only for rufspiel
  won: boolean;
  schneider: boolean;
  schwarz: boolean;
  laufende: number; // 0 or 3-8
  baseAmount: number; // 5 or 20 cents
  transactions: Transaction[];
  version: number; // For conflict resolution
}

// Transaction interface
export interface Transaction {
  from: string; // Player ID
  to: string; // Player ID
  amount: number; // in cents
}

// Game settings
export interface GameSettings {
  maxRounds?: number; // null = unlimited
  baseRates: {
    rufspiel: 5;
    solo: 20;
    wenz: 20;
  };
  allowLaufende: boolean;
}

// Complete game state
export interface GameState {
  tableId: string;
  createdAt: number;
  hostId: string;
  version: number; // Increments with each state change
  players: Player[];
  rounds: Round[];
  settings: GameSettings;
}

// Peer connection
export interface PeerConnection {
  peerId: string;
  status: ConnectionStatus;
  lastPing: number;
  latency: number;
}

// Message types enum
export enum MessageType {
  // Connection
  PING = 'PING',
  PONG = 'PONG',
  PLAYER_JOINED = 'PLAYER_JOINED',
  PLAYER_LEFT = 'PLAYER_LEFT',

  // Host management
  HOST_ANNOUNCEMENT = 'HOST_ANNOUNCEMENT',
  HOST_ELECTION_START = 'HOST_ELECTION_START',

  // Game state
  ROUND_ADDED = 'ROUND_ADDED',
  STATE_SYNC_REQUEST = 'STATE_SYNC_REQUEST',
  STATE_SYNC_RESPONSE = 'STATE_SYNC_RESPONSE',
  SETTINGS_CHANGED = 'SETTINGS_CHANGED',

  // Error handling
  ERROR = 'ERROR',
  STATE_CONFLICT = 'STATE_CONFLICT',
}

// Message envelope
export interface Message {
  type: MessageType;
  timestamp: number;
  senderId: string;
  senderVersion: number;
  data: any;
}

// Round input for UI
export interface RoundInput {
  variant: GameVariant;
  declarer: string;
  partner?: string;
  won: boolean;
  schneider: boolean;
  schwarz: boolean;
  laufende: number;
}
