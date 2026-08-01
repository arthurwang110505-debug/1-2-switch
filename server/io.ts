/**
 * server/io.ts — Socket.io connection handlers (updated with heartbeat)
 */

import { Server, Socket } from 'socket.io';
import { Room, Player, MechanicType } from '../src/types';
import {
  getRoom, createRoom, joinPlayer, reconnectPlayer, removePlayer,
  addScoreToPlayer, generateNewPlaylist, clearRoomInterval
} from './rooms.js';
import { calculateScore, isValidMotionData, getComboState } from './gameplay.js';
import { startNextGameInPlaylist, skipPractice, resetToLobby } from './scheduler.js';

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Heartbeat
    socket.on('heartbeat', () => {
      socket.compress(true).emit('heartbeat-ack', { timestamp: Date.now() });
    });

    // 1. Host creates room
    socket.on('create-room', (callback) => {
      const { code, room } = createRoom(socket.id);
      socket.join(code);
      console.log(`[Server] Created room ${code} for host ${socket.id}`);
      callback({ success: true, roomCode: code, room });
    });

    // 2. Mobile player joins room
    socket.on('join-room', ({ roomCode, playerName }, callback) => {
      const code = roomCode?.toUpperCase();
      const room = getRoom(code);

      if (!room) {
        callback({ success: false, error: '找不到該遊戲房間，請核對房號！' });
        return;
      }

      const { playerId, player } = joinPlayer(room, socket.id, playerName);
      socket.join(code);

      console.log(`[Server] Player ${playerName} (${playerId}) joined room ${code}`);

      callback({ success: true, playerId, room });
      io.to(code).emit('game-state-update', room);
    });

    // 2b. Reconnect player
    socket.on('reconnect-player', ({ roomCode, playerId }, callback) => {
      const code = roomCode?.toUpperCase();
      const room = getRoom(code);
      if (room && room.players[playerId]) {
        reconnectPlayer(room, playerId, socket.id);
        socket.join(code);
        if (callback) callback({ success: true, room });
        io.to(code).emit('game-state-update', room);
      } else {
        if (callback) callback({ success: false });
      }
    });

    // 2c. Connection test
    socket.on('test-connection', ({ roomCode, playerId, buttonName }) => {
      const room = getRoom(roomCode);
      if (!room) return;

      const player = room.players[playerId];
      if (!player) return;

      player.connectionTested = true;
      player.lastTestTime = Date.now();

      io.to(roomCode).emit('player-test-confirmed', {
        playerId,
        playerName: player.name,
        buttonName: buttonName || 'SL/SR',
        timestamp: Date.now()
      });
      io.to(roomCode).emit('game-state-update', room);
    });

    // 2d. Controller button press
    socket.on('controller-btn-press', ({ roomCode, playerId, button }) => {
      const room = getRoom(roomCode);
      if (!room) return;

      const player = room.players[playerId];
      if (!player) return;

      if (button === 'SL' || button === 'SR' || button === 'TEST') {
        player.connectionTested = true;
        player.lastTestTime = Date.now();
        io.to(roomCode).emit('player-test-confirmed', {
          playerId,
          playerName: player.name,
          buttonName: button,
          timestamp: Date.now()
        });
      }

      if (room.gameState === 'lobby' && button === 'A') {
        const playersList = Object.values(room.players);
        if (playersList.length > 0) {
          room.currentGameIndex = 0;
          startNextGameInPlaylist(roomCode);
        }
      }

      io.to(roomCode).emit('remote-btn-click', { playerId, button, timestamp: Date.now() });
      io.to(roomCode).emit('game-state-update', room);
    });

    // 3. Select total game time
    socket.on('select-time', ({ roomCode, minutes }) => {
      const room = getRoom(roomCode);
      if (!room || room.gameState !== 'lobby') return;

      generateNewPlaylist(room, minutes);
      io.to(roomCode).emit('game-state-update', room);
    });

    // 4. Start game
    socket.on('start-game', ({ roomCode }) => {
      console.log(`[Server] start-game event received, roomCode: ${roomCode}, socket.id: ${socket.id}`);
      const room = getRoom(roomCode);
      if (!room) {
        console.log(`[Server] Room ${roomCode} not found!`);
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      console.log(`[Server] Found room ${roomCode}, gameState: ${room.gameState}, players: ${Object.keys(room.players).length}`);
      console.log(`[Server] playlist length: ${room.playlist?.length}, currentGameIndex: ${room.currentGameIndex}`);
      console.log(`[Server] Room code from URL: ${roomCode}, Room code from state: ${room.code}`);

      room.currentGameIndex = 0;
      Object.values(room.players).forEach((p) => {
        p.score = 0;
        p.roundScore = 0;
      });

      console.log(`[Server] Calling startNextGameInPlaylist...`);
      startNextGameInPlaylist(roomCode);
      console.log(`[Server] startNextGameInPlaylist completed`);
    });

    // 5. Reset to lobby
    socket.on('reset-to-lobby', ({ roomCode }) => {
      const room = getRoom(roomCode);
      if (!room) return;
      resetToLobby(roomCode);
    });

    // 6. Motion data from mobile
    socket.on('player-motion', ({ roomCode, playerId, mechanicType, intensity, acc, rot, isSpecialTrigger }) => {
      const room = getRoom(roomCode);
      if (!room || (room.gameState !== 'playing' && room.gameState !== 'practice')) return;

      const player = room.players[playerId];
      if (!player) return;

      // Anti-cheat: validate motion data
      if (!isValidMotionData(intensity, acc)) {
        console.warn(`[Anti-cheat] Invalid motion data from player ${playerId}`);
        return;
      }

      // Update player state
      player.intensity = intensity;
      if (rot) player.currentAngles = rot;
      player.lastActionTime = Date.now();

      const currentGame = room.playlist[room.currentGameIndex];
      if (!currentGame) return;

      if (room.gameState === 'playing') {
        const result = calculateScore(
          room, player, mechanicType, intensity, acc, rot, isSpecialTrigger
        );

        if (result.scoreGained > 0) {
          addScoreToPlayer(room, playerId, result.scoreGained);
        }

        if (result.penalty) {
          player.roundScore = Math.max(0, player.roundScore - result.penalty);
        }

        if (result.isFalseStart) {
          player.quickDrawTime = -1;
          socket.emit('vibrate-feedback', [200, 100, 200, 100, 200]);
        }

        if (mechanicType === 'quick_draw' && result.scoreGained > 0) {
          socket.emit('vibrate-feedback', [150, 50, 150]);
        }
      }

      io.to(roomCode).emit('game-state-update', room);
    });

    // 7. Skip practice
    socket.on('skip-practice', ({ roomCode }) => {
      skipPractice(roomCode);
    });

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}, reason: ${reason}`);

      const rooms = (globalThis as any).getRooms?.() ?? {};
      for (const [code, room] of Object.entries(rooms)) {
        for (const [playerId, player] of Object.entries((room as Room).players)) {
          if ((player as Player).socketId === socket.id) {
            (player as Player).isEliminated = true;
            console.log(`[Server] Player ${(player as Player).name} disconnected, marked as eliminated`);
            io.to(code).emit('game-state-update', room);
            break;
          }
        }
      }
    });
  });
}
