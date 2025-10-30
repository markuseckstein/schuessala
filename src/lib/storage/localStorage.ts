/**
 * Local storage utilities for persisting user preferences
 */

const PLAYER_NAME_KEY = 'schafkopf-player-name';

export function savePlayerName(name: string): void {
  try {
    localStorage.setItem(PLAYER_NAME_KEY, name);
  } catch (error) {
    console.error('Failed to save player name:', error);
  }
}

export function getPlayerName(): string | null {
  try {
    return localStorage.getItem(PLAYER_NAME_KEY);
  } catch (error) {
    console.error('Failed to get player name:', error);
    return null;
  }
}

export function clearPlayerName(): void {
  try {
    localStorage.removeItem(PLAYER_NAME_KEY);
  } catch (error) {
    console.error('Failed to clear player name:', error);
  }
}
