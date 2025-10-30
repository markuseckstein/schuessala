import { writable } from 'svelte/store';
import type { ConnectionStatus, PeerRole } from '../lib/game/types';

interface PeerState {
  myPeerId: string;
  tableId: string;
  role: PeerRole | null;
  status: ConnectionStatus;
  hostId: string;
  connectedPeers: string[];
}

function createInitialPeerState(): PeerState {
  return {
    myPeerId: '',
    tableId: '',
    role: null,
    status: 'disconnected',
    hostId: '',
    connectedPeers: [],
  };
}

function createPeerStore() {
  const { subscribe, set, update } = writable<PeerState>(
    createInitialPeerState()
  );

  return {
    subscribe,
    set,

    // Initialize as host
    initAsHost: (tableId: string, myPeerId: string) => {
      update((state) => ({
        ...state,
        myPeerId,
        tableId,
        role: 'host',
        status: 'connected',
        hostId: myPeerId,
      }));
    },

    // Initialize as peer
    initAsPeer: (tableId: string, myPeerId: string, hostId: string) => {
      update((state) => ({
        ...state,
        myPeerId,
        tableId,
        role: 'peer',
        status: 'connecting',
        hostId,
      }));
    },

    // Set connection status
    setStatus: (status: ConnectionStatus) => {
      update((state) => ({ ...state, status }));
    },

    // Add connected peer
    addPeer: (peerId: string) => {
      update((state) => ({
        ...state,
        connectedPeers: [...new Set([...state.connectedPeers, peerId])],
        status: 'connected',
      }));
    },

    // Remove disconnected peer
    removePeer: (peerId: string) => {
      update((state) => ({
        ...state,
        connectedPeers: state.connectedPeers.filter((id) => id !== peerId),
      }));
    },

    // Become host (after election)
    becomeHost: () => {
      update((state) => ({
        ...state,
        role: 'host',
        hostId: state.myPeerId,
      }));
    },

    // Set new host
    setHost: (hostId: string) => {
      update((state) => ({
        ...state,
        hostId,
        role: state.myPeerId === hostId ? 'host' : 'peer',
      }));
    },

    // Reset
    reset: () => {
      set(createInitialPeerState());
    },
  };
}

export const peerStore = createPeerStore();
