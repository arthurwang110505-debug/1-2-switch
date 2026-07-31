import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { HostLobby } from './HostLobby';
import { HostPractice } from './HostPractice';
import { HostCountdown } from './HostCountdown';
import { HostPlaying } from './HostPlaying';
import { HostResult } from './HostResult';
import { HostLeaderboard } from './HostLeaderboard';
import { Room, GameItem } from '../types';
import { Play, RotateCcw } from 'lucide-react';

interface HostScreenProps {
  socket: Socket;
  room: Room | null;
  roomCode: string;
}

export const HostScreen: React.FC<HostScreenProps> = ({ socket, room, roomCode }) => {
  const [selectedGameForRules, setSelectedGameForRules] = useState<GameItem | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);

  if (!room) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-6">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xl font-bold tracking-wide">正在建立派對遊戲房間...</p>
      </div>
    );
  }

  const currentGame = room.playlist?.[room.currentGameIndex];

  const handleOpenRules = (game: GameItem) => {
    setSelectedGameForRules(game);
    setIsRulesModalOpen(true);
  };

  const handleStartTime = (minutes: number) => {
    socket.emit('select-time', { roomCode, minutes });
  };

  const handleStartGame = () => {
    socket.emit('start-game', { roomCode });
  };

  const handlePlayAgain = () => {
    socket.emit('reset-to-lobby', { roomCode });
  };

  const handleSkipPractice = () => {
    socket.emit('skip-practice', { roomCode });
  };

  // Render based on game state
  switch (room.gameState) {
    case 'lobby':
      return (
        <HostLobby
          socket={socket}
          room={room}
          roomCode={roomCode}
          onStartTime={handleStartTime}
          onStartGame={handleStartGame}
          onOpenRules={handleOpenRules}
        />
      );
    case 'practice':
      return (
        <HostPractice
          socket={socket}
          room={room}
          currentGame={currentGame}
          onSkipPractice={handleSkipPractice}
        />
      );
    case 'countdown':
      return (
        <HostCountdown
          socket={socket}
          room={room}
          currentGame={currentGame}
          onOpenRules={handleOpenRules}
        />
      );
    case 'playing':
      return (
        <HostPlaying
          socket={socket}
          room={room}
          currentGame={currentGame}
          onOpenRules={handleOpenRules}
        />
      );
    case 'game_result':
      return (
        <HostResult
          room={room}
          currentGame={currentGame}
          onOpenRules={handleOpenRules}
        />
      );
    case 'leaderboard':
      return (
        <HostLeaderboard
          room={room}
          onPlayAgain={handlePlayAgain}
          soundEnabled={true}
        />
      );
    default:
      return null;
  }
};
