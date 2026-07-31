import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Room, GameItem } from '../types';
import { Clock, HelpCircle } from 'lucide-react';
import { GameRulesModal } from './GameRulesModal';
import { playSound } from '../utils/audioSynth';

interface HostCountdownProps {
  socket: Socket;
  room: Room;
  currentGame?: GameItem;
  onOpenRules: (game: GameItem) => void;
}

export const HostCountdown: React.FC<HostCountdownProps> = ({
  socket, room, currentGame, onOpenRules
}) => {
  const [selectedGameForRules, setSelectedGameForRules] = useState<GameItem | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [isSlotRevealing, setIsSlotRevealing] = useState<boolean>(true);
  const [previewIcon, setPreviewIcon] = useState<string>('🎰');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!currentGame) return;

    // Slot machine reveal animation
    setIsSlotRevealing(true);
    playSound.transition();

    let step = 0;
    const totalSteps = 20;
    const allIcons = room.playlist?.map(g => g.icon) || [];

    intervalRef.current = setInterval(() => {
      step++;
      // Cycle through random icons
      setPreviewIcon(allIcons[step % allIcons.length] || '🎮');

      if (step >= totalSteps) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setPreviewIcon(currentGame.icon);
        setIsSlotRevealing(false);
        playSound.bang();
      }
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentGame, room.playlist]);

  const handleOpenRules = (game: GameItem) => {
    setSelectedGameForRules(game);
    setIsRulesModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-8 select-none relative overflow-hidden">
      <GameRulesModal
        game={selectedGameForRules}
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/50 to-slate-950" />

      {/* Decorative slot machine lights */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

      <div className="z-10 text-center max-w-2xl w-full">
        <div className="flex justify-center items-center gap-3 mb-6">
          <span className="text-xs font-black tracking-widest text-amber-400 uppercase bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/30">
            GAME {room.currentGameIndex + 1} / {room.playlist.length}
          </span>
          {currentGame && (
            <button
              onClick={() => handleOpenRules(currentGame)}
              className="text-xs font-black px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700 flex items-center gap-1 text-indigo-300 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" /> 查看規則
            </button>
          )}
        </div>

        {/* Slot machine display */}
        <div className="relative inline-block mb-6">
          <div className={`
            w-32 h-32 rounded-3xl border-4 flex items-center justify-center text-7xl
            transition-all duration-300
            ${isSlotRevealing
              ? 'border-amber-400 animate-pulse bg-slate-900/90 shadow-[0_0_40px_rgba(251,191,36,0.5)]'
              : 'border-emerald-400 bg-gradient-to-br from-emerald-950 to-slate-900 shadow-[0_0_40px_rgba(52,211,153,0.4)]'
            }
          `}>
            <span className={isSlotRevealing ? 'animate-bounce' : 'animate-scale-in'}>
              {previewIcon}
            </span>
          </div>

          {/* Slot machine lights decoration */}
          <div className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-amber-400 animate-pulse" />
          <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-400 animate-pulse delay-150" />
          <div className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-indigo-400 animate-pulse delay-300" />
          <div className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-emerald-400 animate-pulse delay-450" />
        </div>

        {/* Game reveal */}
        <div className={`transition-all duration-500 ${isSlotRevealing ? 'opacity-50 blur-sm' : 'opacity-100 blur-0'}`}>
          <h2 className="text-5xl font-black text-white mb-4 tracking-tight">
            {currentGame?.name}
          </h2>
          <p className="text-xl text-slate-300 font-medium mb-8 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl leading-relaxed">
            {currentGame?.instruction}
          </p>
        </div>

        {/* Countdown */}
        <div className="my-8">
          <div className="text-8xl font-black text-amber-400 font-mono animate-pulse drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]">
            {room.timerSeconds}
          </div>
          <p className="text-slate-400 font-bold tracking-widest text-sm mt-2 uppercase">
            {isSlotRevealing ? '正在抽選遊戲...' : '預備... 請握緊手機！'}
          </p>
        </div>

        {/* Slot machine strip dots */}
        <div className="flex justify-center gap-2 mt-4">
          {room.playlist.slice(0, 10).map((game, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                isSlotRevealing
                  ? i === (room.currentGameIndex % 10)
                    ? 'bg-amber-400 scale-125'
                    : 'bg-slate-700'
                  : game.id === currentGame?.id
                  ? 'bg-emerald-400'
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
