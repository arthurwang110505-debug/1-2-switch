import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Room, GameItem, Player } from '../types';
import { Clock, HelpCircle } from 'lucide-react';
import { GameRulesModal } from './GameRulesModal';

interface HostPracticeProps {
  socket: Socket;
  room: Room;
  currentGame?: GameItem;
  onSkipPractice: () => void;
}

export const HostPractice: React.FC<HostPracticeProps> = ({
  socket, room, currentGame, onSkipPractice
}) => {
  const [selectedGameForRules, setSelectedGameForRules] = useState<GameItem | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);

  const handleOpenRules = (game: GameItem) => {
    setSelectedGameForRules(game);
    setIsRulesModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col p-6 sm:p-8 font-sans relative overflow-hidden select-none">
      <GameRulesModal
        game={selectedGameForRules}
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      {/* Header */}
      <header className="flex justify-between items-center mb-6 z-10">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/10">
            {currentGame?.icon || '🎮'}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wide">
                🧪 試玩練習階段
              </span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                GAME {room.currentGameIndex + 1} / {room.playlist.length}
              </span>
            </div>
            <h2 className="text-3xl font-black text-white">{currentGame?.name}</h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900/90 px-5 py-2.5 rounded-2xl border border-amber-400/40 shadow-xl">
            <Clock className="w-6 h-6 text-amber-400 animate-spin" />
            <span className="text-3xl font-black font-mono text-amber-400">{room.timerSeconds}s</span>
          </div>
          <button
            onClick={onSkipPractice}
            className="py-3 px-6 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-extrabold rounded-2xl shadow-xl transition cursor-pointer text-sm flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <span>確認開始比賽</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 z-10">
        {/* Left: Rules & Instructions */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-6 flex flex-col justify-between shadow-2xl">
          <div className="space-y-4">
            <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800">
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                📖 玩法講解
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed font-medium">{currentGame?.description}</p>
            </div>

            <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/30">
              <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                📱 體感動作指示
              </h3>
              <p className="text-base font-extrabold text-amber-200">{currentGame?.instruction}</p>
            </div>

            <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/30">
              <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                🎯 評分要訣
              </h3>
              <p className="text-sm text-slate-300 font-medium">{currentGame?.targetHint}</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-center">
            <p className="text-xs text-slate-400 font-bold">
              💡 現在請拿起手機練習體感，右側即時測試區域會顯示您的感應反應！
            </p>
          </div>
        </div>

        {/* Right: Player Motion Test Area */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-2xl">
          <div>
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              📊 玩家體感即時測試區
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.values(room.players).map((player: Player) => {
                const intensityPct = Math.min(Math.max(player.intensity || 0, 0), 100);
                return (
                  <div
                    key={player.id}
                    className="bg-slate-950 p-4 rounded-2xl border-2 flex flex-col justify-between shadow-lg"
                    style={{ borderColor: player.color || '#6366f1' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl font-black border border-white/20"
                          style={{ backgroundColor: player.color }}
                        >
                          {player.avatar}
                        </div>
                        <span className="font-extrabold text-slate-200 text-sm">{player.name}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {intensityPct}%
                      </span>
                    </div>

                    <div>
                      <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                        <div
                          className="bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 h-full rounded-full transition-all duration-75"
                          style={{ width: `${intensityPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                        <span>靜止</span>
                        <span>最高力道</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={onSkipPractice}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base rounded-2xl shadow-lg transition cursor-pointer"
            >
              所有玩家測試完畢 · 開始正式比賽 ({room.timerSeconds}s 後自動開始)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
