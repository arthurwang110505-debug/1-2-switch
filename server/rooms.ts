/**
 * server/rooms.ts — Room state management
 * Handles room lifecycle: create, join, disconnect, player management
 */

import { Room, Player, GameState, GameItem } from '../src/types.js';
import { GAMES_DATABASE } from '../src/data/gamesDatabase.js';
import { generatePlaylist } from '../src/utils/gameScheduler.js';

const PLAYER_COLORS = [
  '#ef4444', '#3b82f6', '#eab308', '#22c55e',
  '#a855f7', '#f97316', '#06b6d4', '#ec4899'
];

const PLAYER_AVATARS = ['🤠', '🚀', '🦊', '⚡', '🐱', '🐼', '🐯', '🦄'];

const rooms: Record<string, Room> = {};
const roomIntervals: Record<string, NodeJS.Timeout> = {};

export function getRooms(): Record<string, Room> {
  return rooms;
}

export function getRoomIntervals(): Record<string, NodeJS.Timeout> {
  return roomIntervals;
}

export function getRoom(code: string): Room | undefined {
  return rooms[code];
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms[code] ? generateRoomCode() : code;
}

export function createRoom(hostSocketId: string): { code: string; room: Room } {
  const code = generateRoomCode();
  const initialPlaylist = generatePlaylist(GAMES_DATABASE, 5);

  const newRoom: Room = {
    code,
    hostSocketId,
    players: {},
    targetMinutes: 5,
    playlist: initialPlaylist,
    currentGameIndex: 0,
    gameState: 'lobby',
    timerSeconds: 0
  };

  rooms[code] = newRoom;
  return { code, room: newRoom };
}

export function joinPlayer(
  room: Room,
  socketId: string,
  playerName: string
): { playerId: string; player: Player } {
  const playerId = `p_${socketId.substring(0, 5)}`;
  const existingPlayers = Object.values(room.players);
  const playerIndex = existingPlayers.length;

  const joyconSide = playerIndex % 2 === 0 ? 'right' : 'left';
  const defaultColor = joyconSide === 'right' ? '#ff4554' : '#00c3e3';

  const newPlayer: Player = {
    id: playerId,
    socketId,
    name: playerName || `玩家 ${playerIndex + 1}`,
    avatar: PLAYER_AVATARS[playerIndex % PLAYER_AVATARS.length],
    color: PLAYER_COLORS[playerIndex % PLAYER_COLORS.length] || defaultColor,
    score: 0,
    roundScore: 0,
    ready: true,
    connectionTested: false,
    joyconSide,
    intensity: 0,
    currentAngles: { alpha: 0, beta: 0, gamma: 0 }
  };

  room.players[playerId] = newPlayer;
  return { playerId, player: newPlayer };
}

export function reconnectPlayer(room: Room, playerId: string, newSocketId: string): boolean {
  const player = room.players[playerId];
  if (!player) return false;
  player.socketId = newSocketId;
  return true;
}

export function removePlayer(room: Room, playerId: string): boolean {
  if (!room.players[playerId]) return false;
  delete room.players[playerId];
  return true;
}

export function resetPlayerScores(room: Room): void {
  Object.values(room.players).forEach((p) => {
    p.score = 0;
    p.roundScore = 0;
    p.quickDrawTime = null;
    p.intensity = 0;
    p.isEliminated = false;
  });
}

export function resetRoundScores(room: Room): void {
  Object.values(room.players).forEach((p) => {
    p.roundScore = 0;
    p.quickDrawTime = null;
    p.intensity = 0;
  });
}

export function addScoreToPlayer(room: Room, playerId: string, score: number): void {
  const player = room.players[playerId];
  if (player) {
    player.roundScore += score;
    player.score += score;
  }
}

export function generateNewPlaylist(room: Room, minutes: number): void {
  room.targetMinutes = minutes;
  room.playlist = generatePlaylist(GAMES_DATABASE, minutes);
}

export function clearRoomInterval(roomCode: string): void {
  if (roomIntervals[roomCode]) {
    clearInterval(roomIntervals[roomCode]);
    delete roomIntervals[roomCode];
  }
}
