import Peer, { type DataConnection } from 'peerjs';
import type { Message, MessageType } from '../game/types';

export type ConnectionCallback = (peerId: string) => void;
export type MessageCallback = (message: Message, fromPeer: string) => void;
export type DisconnectCallback = (peerId: string) => void;

export class PeerManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private isHost: boolean = false;
  private myPeerId: string = '';
  private tableId: string = '';

  // Callbacks
  private onConnectionCallback?: ConnectionCallback;
  private onMessageCallback?: MessageCallback;
  private onDisconnectCallback?: DisconnectCallback;

  /**
   * Create a new table (become host)
   */
  async createTable(): Promise<string> {
    const tableId = this.generateTableId();
    this.tableId = tableId;
    this.isHost = true;

    return new Promise((resolve, reject) => {
      this.peer = new Peer(tableId, {
        debug: 2, // Set to 0 for production
      });

      this.peer.on('open', (id) => {
        this.myPeerId = id;
        console.log('Table created with ID:', id);
        resolve(tableId);
      });

      this.peer.on('connection', (conn) => {
        console.log('Incoming connection from:', conn.peer);
        this.handleNewConnection(conn);
      });

      this.peer.on('error', (error) => {
        console.error('Peer error:', error);
        reject(error);
      });
    });
  }

  /**
   * Join an existing table
   */
  async joinTable(tableId: string): Promise<void> {
    this.tableId = tableId;
    this.isHost = false;

    return new Promise((resolve, reject) => {
      this.peer = new Peer({
        debug: 2,
      });

      this.peer.on('open', (id) => {
        this.myPeerId = id;
        console.log('My peer ID:', id);

        // Connect to host
        const conn = this.peer!.connect(tableId);
        this.handleNewConnection(conn);

        // Listen for additional peer connections (mesh)
        this.peer!.on('connection', (conn) => {
          console.log('Peer connection from:', conn.peer);
          this.handleNewConnection(conn);
        });

        resolve();
      });

      this.peer.on('error', (error) => {
        console.error('Peer error:', error);
        reject(error);
      });
    });
  }

  /**
   * Handle a new peer connection
   */
  private handleNewConnection(conn: DataConnection): void {
    conn.on('open', () => {
      console.log('Connection established with:', conn.peer);
      this.connections.set(conn.peer, conn);

      // Notify callback
      if (this.onConnectionCallback) {
        this.onConnectionCallback(conn.peer);
      }

      // If we're host, tell other peers about this new peer
      if (this.isHost && conn.peer !== this.tableId) {
        this.broadcast(
          {
            type: 'PEER_JOINED' as any,
            timestamp: Date.now(),
            senderId: this.myPeerId,
            senderVersion: 0,
            data: { peerId: conn.peer },
          },
          [conn.peer]
        );
      }
    });

    conn.on('data', (data) => {
      const message = data as Message;
      console.log('Received message:', message.type, 'from:', conn.peer);

      if (this.onMessageCallback) {
        this.onMessageCallback(message, conn.peer);
      }
    });

    conn.on('close', () => {
      console.log('Connection closed with:', conn.peer);
      this.connections.delete(conn.peer);

      if (this.onDisconnectCallback) {
        this.onDisconnectCallback(conn.peer);
      }
    });

    conn.on('error', (error) => {
      console.error('Connection error with', conn.peer, error);
    });
  }

  /**
   * Send message to a specific peer
   */
  send(peerId: string, message: Message): void {
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      conn.send(message);
    } else {
      console.warn('Cannot send to', peerId, '- not connected');
    }
  }

  /**
   * Broadcast message to all connected peers (except excluded ones)
   */
  broadcast(message: Message, excludePeers: string[] = []): void {
    this.connections.forEach((conn, peerId) => {
      if (!excludePeers.includes(peerId) && conn.open) {
        conn.send(message);
      }
    });
  }

  /**
   * Connect to a specific peer (for mesh topology)
   */
  async connectToPeer(peerId: string): Promise<void> {
    if (this.connections.has(peerId)) {
      console.log('Already connected to', peerId);
      return;
    }

    if (!this.peer) {
      throw new Error('Peer not initialized');
    }

    const conn = this.peer.connect(peerId);
    this.handleNewConnection(conn);
  }

  /**
   * Get list of connected peer IDs
   */
  getConnectedPeers(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Get my peer ID
   */
  getMyPeerId(): string {
    return this.myPeerId;
  }

  /**
   * Get table ID
   */
  getTableId(): string {
    return this.tableId;
  }

  /**
   * Check if this peer is the host
   */
  getIsHost(): boolean {
    return this.isHost;
  }

  /**
   * Set callbacks
   */
  onConnection(callback: ConnectionCallback): void {
    this.onConnectionCallback = callback;
  }

  onMessage(callback: MessageCallback): void {
    this.onMessageCallback = callback;
  }

  onDisconnect(callback: DisconnectCallback): void {
    this.onDisconnectCallback = callback;
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }

  /**
   * Generate a readable table ID
   */
  private generateTableId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return `GAME-${code}`;
  }
}

// Singleton instance
export const peerManager = new PeerManager();
