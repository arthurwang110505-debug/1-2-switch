/**
 * server/scheduler.ts — Game phase management
 * Handles: practice → countdown → playing → result → next game → leaderboard
 */

import { Server } from 'socket.io';
import { Room, GameState } from '../src/types.js';
import {
  getRoom, getRoomIntervals, clearRoomInterval, resetRoundScores
} from './rooms.js';

function getIo(): Server | undefined {
  return (globalThis as any).io as Server | undefined;
}

/**
 * Start the next game in the playlist
 */
export function startNextGameInPlaylist(roomCode: string): void {
  const io = getIo();
  if (!io) {
    console.log(`[Scheduler] Socket.io instance is not initialized for ${roomCode}`);
    return;
  }
  const room = getRoom(roomCode);
  if (!room) {
    console.log(`[Scheduler] Room ${roomCode} not found in startNextGameInPlaylist`);
    return;
  }

  console.log(`[Scheduler] startNextGameInPlaylist called for ${roomCode}`);
  console.log(`[Scheduler] gameState: ${room.gameState}, currentGameIndex: ${room.currentGameIndex}`);

  clearRoomInterval(roomCode);

  // Check if all games are done
  if (room.currentGameIndex >= room.playlist.length) {
    console.log(`[Scheduler] All games done, moving to leaderboard`);
    room.gameState = 'leaderboard';
    io.to(roomCode).emit('game-state-update', room);
    return;
  }

  const currentGame = room.playlist[room.currentGameIndex];
  if (!currentGame) {
    console.log(`[Scheduler] No current game at index ${room.currentGameIndex}`);
    return;
  }

  console.log(`[Scheduler] Starting game: ${currentGame.name} (${currentGame.mechanicType})`);

  // 1. Practice phase (30 seconds)
  room.gameState = 'practice';
  room.timerSeconds = 30;
  room.signalActive = false;
  room.signalTime = undefined;

  resetRoundScores(room);
  io.to(roomCode).emit('game-state-update', room);
  console.log(`[Scheduler] Emitted game-state-update to ${roomCode}, gameState: ${room.gameState}`);

  let practiceTimer = 30;
  const interval = setInterval(() => {
    practiceTimer--;
    const updatedRoom = getRoom(roomCode);
    if (!updatedRoom) {
      clearInterval(interval);
      return;
    }
    updatedRoom.timerSeconds = practiceTimer;
    io.to(roomCode).emit('game-state-update', updatedRoom);

    if (practiceTimer <= 0) {
      clearInterval(interval);
      runCountdownPhase(roomCode);
    }
  }, 1000);

  getRoomIntervals()[roomCode] = interval;
}

/**
 * 3-second countdown before game starts
 */
function runCountdownPhase(roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room) return;

  clearRoomInterval(roomCode);

  const currentGame = room.playlist[room.currentGameIndex];
  if (!currentGame) return;

  const io = getIo();
  if (!io) {
    console.log(`[Scheduler] Socket.io instance is not available for countdown phase ${roomCode}`);
    return;
  }

  room.gameState = 'countdown';
  room.timerSeconds = 3;
  room.signalActive = false;
  room.signalTime = undefined;

  resetRoundScores(room);
  io.to(roomCode).emit('game-state-update', room);

  let countdownTimer = 3;
  const interval = setInterval(() => {
    countdownTimer--;
    const updatedRoom = getRoom(roomCode);
    if (!updatedRoom) {
      clearInterval(interval);
      return;
    }
    updatedRoom.timerSeconds = countdownTimer;
    io.to(roomCode).emit('game-state-update', updatedRoom);

    if (countdownTimer <= 0) {
      clearInterval(interval);
      runPlayingPhase(roomCode, currentGame);
    }
  }, 1000);

  getRoomIntervals()[roomCode] = interval;
}

/**
 * Main playing phase
 */
function runPlayingPhase(roomCode: string, game: { estimatedSeconds: number; mechanicType: string }): void {
  const room = getRoom(roomCode);
  if (!room) return;

  const io = getIo();
  if (!io) {
    console.log(`[Scheduler] Socket.io instance is not available for playing phase ${roomCode}`);
    return;
  }

  room.gameState = 'playing';
  room.timerSeconds = game.estimatedSeconds;
  io.to(roomCode).emit('game-state-update', room);

  // Quick draw: random signal delay between 2-6 seconds
  if (game.mechanicType === 'quick_draw') {
    const delay = Math.floor(Math.random() * 4000) + 2000;
    const signalTimeout = setTimeout(() => {
      const updatedRoom = getRoom(roomCode);
      if (updatedRoom && updatedRoom.gameState === 'playing') {
        updatedRoom.signalActive = true;
        updatedRoom.signalTime = Date.now();
        io.to(roomCode).emit('game-state-update', updatedRoom);
      }
    }, delay);

    // Store timeout reference for cleanup
    (room as any)._signalTimeout = signalTimeout;
  }

  let playingTimer = game.estimatedSeconds;
  const interval = setInterval(() => {
    playingTimer--;
    const updatedRoom = getRoom(roomCode);
    if (!updatedRoom) {
      clearInterval(interval);
      return;
    }
    updatedRoom.timerSeconds = playingTimer;
    io.to(roomCode).emit('game-state-update', updatedRoom);

    if (playingTimer <= 0) {
      clearInterval(interval);
      runGameResultPhase(roomCode);
    }
  }, 1000);

  getRoomIntervals()[roomCode] = interval;
}

/**
 * Round result phase — show scores for 5 seconds, then next game
 */
function runGameResultPhase(roomCode: string): void {
  const io = getIo();
  if (!io) {
    console.log(`[Scheduler] Socket.io instance is not available for game result phase ${roomCode}`);
    return;
  }

  const room = getRoom(roomCode);
  if (!room) return;

  room.gameState = 'game_result';
  io.to(roomCode).emit('game-state-update', room);

  // Auto-advance after 5 seconds
  const timeout = setTimeout(() => {
    const updatedRoom = getRoom(roomCode);
    if (updatedRoom && updatedRoom.gameState === 'game_result') {
      updatedRoom.currentGameIndex++;
      startNextGameInPlaylist(roomCode);
    }
  }, 5000);

  (room as any)._resultTimeout = timeout;
}

/**
 * Skip practice phase (host approved)
 */
export function skipPractice(roomCode: string): boolean {
  const room = getRoom(roomCode);
  if (!room || room.gameState !== 'practice') return false;

  clearRoomInterval(roomCode);
  runCountdownPhase(roomCode);
  return true;
}

/**
 * Reset room back to lobby
 */
export function resetToLobby(roomCode: string): void {
  const room = getRoom(roomCode);
  if (!room) return;

  clearRoomInterval(roomCode);
  if ((room as any)._signalTimeout) clearTimeout((room as any)._signalTimeout);
  if ((room as any)._resultTimeout) clearTimeout((room as any)._resultTimeout);

  room.gameState = 'lobby';
  room.currentGameIndex = 0;
  room.signalActive = false;
  room.signalTime = undefined;

  // Reset all scores
  Object.values(room.players).forEach((p) => {
    p.score = 0;
    p.roundScore = 0;
    p.quickDrawTime = null;
    p.intensity = 0;
    p.isEliminated = false;
  });

  const io = getIo();
  if (io) {
    io.to(roomCode).emit('game-state-update', room);
  }
}
