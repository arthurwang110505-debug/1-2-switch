import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import { Room, GameItem, Player } from '../types';
import { Clock, HelpCircle } from 'lucide-react';
import { GameRulesModal } from './GameRulesModal';

interface HostPlayingProps {
  socket: Socket;
  room: Room;
  currentGame?: GameItem;
  onOpenRules: (game: GameItem) => void;
}

export const HostPlaying: React.FC<HostPlayingProps> = ({
  socket, room, currentGame, onOpenRules
}) => {
  const [selectedGameForRules, setSelectedGameForRules] = useState<GameItem | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);

  const handleOpenRules = (game: GameItem) => {
    setSelectedGameForRules(game);
    setIsRulesModalOpen(true);
  };

  const playersList: Player[] = Object.values(room.players || {});

  return (
    <div className={`min-h-screen ${currentGame?.bgTheme || 'bg-slate-950'} text-white flex flex-col p-8 select-none relative overflow-hidden font-sans`}>
      <GameRulesModal
        game={selectedGameForRules}
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      {/* Header */}
      <header className="flex justify-between items-center mb-6 bg-slate-900/70 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl z-20">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{currentGame?.icon}</span>
          <div>
            <h2 className="text-2xl font-black">{currentGame?.name}</h2>
            <p className="text-xs text-slate-300 font-medium">{currentGame?.instruction}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {currentGame && (
            <button
              onClick={() => handleOpenRules(currentGame)}
              className="text-xs font-extrabold px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 flex items-center gap-1.5 text-indigo-300 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" /> 規則
            </button>
          )}

          <div className="flex items-center gap-2 bg-black/40 px-5 py-2.5 rounded-xl border border-amber-400/30">
            <Clock className="w-6 h-6 text-amber-400 animate-spin" />
            <span className="text-3xl font-black font-mono text-amber-400">
              {room.timerSeconds}s
            </span>
          </div>
        </div>
      </header>

      {/* Game Arena */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch my-2 z-10">
        {playersList.map((player: Player) => {
          const intensityPct = Math.min(Math.max(player.intensity || 0, 0), 100);

          return (
            <div
              key={player.id}
              className="bg-slate-900/80 backdrop-blur-md border-2 rounded-3xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all duration-100"
              style={{ borderColor: player.color || '#6366f1' }}
            >
              {/* Player Info */}
              <div className="flex items-center justify-between mb-4 z-10">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black border-2 border-white/20 shadow-md"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.avatar}
                  </div>
                  <div>
                    <div className="font-extrabold text-lg text-white">{player.name}</div>
                    <div className="text-xs text-slate-400 font-mono font-bold">
                      總分: {player.score} pts
                    </div>
                  </div>
                </div>

                <div className="text-2xl font-black text-amber-400 font-mono">
                  +{player.roundScore}
                </div>
              </div>

              {/* Mechanic-specific Visual */}
              <div className="flex-1 flex flex-col justify-center items-center my-4 z-10">
                {currentGame?.mechanicType === 'quick_draw' && (
                  <div className="text-center w-full">
                    {room.signalActive ? (
                      <div className="bg-rose-600 text-white font-black text-4xl p-6 rounded-2xl animate-ping shadow-2xl shadow-rose-600">
                        BANG!
                      </div>
                    ) : player.quickDrawTime === -1 ? (
                      <div className="bg-red-950/90 border border-red-500/50 p-4 rounded-2xl">
                        <div className="text-xs text-red-400 font-bold uppercase">早拔槍！淘汰</div>
                      </div>
                    ) : player.quickDrawTime ? (
                      <div className="bg-emerald-950/90 border border-emerald-500/50 p-4 rounded-2xl">
                        <div className="text-xs text-emerald-400 font-bold uppercase">反應時間</div>
                        <div className="text-4xl font-mono font-black text-emerald-300">
                          {player.quickDrawTime} ms
                        </div>
                      </div>
                    ) : (
                      <div className="text-amber-400 font-bold text-lg animate-pulse bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                        專注聽訊號...
                      </div>
                    )}
                  </div>
                )}

                {currentGame?.mechanicType === 'shake' && (
                  <div className="w-full flex flex-col items-center">
                    <div className="text-5xl mb-3 animate-bounce">
                      {intensityPct > 60 ? '🔥' : intensityPct > 20 ? '⚡' : '🥤'}
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-8 p-1 border border-slate-800 relative shadow-inner">
                      <div
                        className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500"
                        style={{ width: `${intensityPct}%` }}
                      />
                    </div>
                    <p className="text-xs font-bold text-slate-400 mt-2">
                      搖晃強度: {intensityPct}%
                    </p>
                  </div>
                )}

                {currentGame?.mechanicType === 'whip' && (
                  <div className="w-full text-center">
                    <div
                      className="text-5xl mb-2 transition-transform duration-100"
                      style={{ transform: `scale(${1 + intensityPct / 100})` }}
                    >
                      {currentGame.icon}
                    </div>
                    <div className="text-sm font-extrabold text-slate-200 mt-2">
                      爆發力量: {intensityPct}%
                    </div>
                  </div>
                )}

                {currentGame?.mechanicType === 'tilt' && (
                  <div className="w-full text-center">
                    <div
                      className="w-24 h-24 rounded-full border-4 border-dashed border-amber-400 mx-auto flex items-center justify-center text-3xl transition-transform duration-100 shadow-lg"
                      style={{ transform: `rotate(${player.currentAngles?.gamma || 0}deg)` }}
                    >
                      🎯
                    </div>
                    <p className="text-xs text-amber-300 font-mono font-bold mt-3">
                      傾斜角度: {Math.round(player.currentAngles?.gamma || 0)}°
                    </p>
                  </div>
                )}

                {currentGame?.mechanicType === 'hold_still' && (
                  <div className="w-full text-center">
                    {intensityPct > 15 ? (
                      <div className="bg-rose-950/80 border border-rose-500 p-4 rounded-xl text-rose-300 font-bold text-sm animate-bounce">
                        ⚠️ 顫抖警告！
                      </div>
                    ) : (
                      <div className="bg-emerald-950/80 border border-emerald-500/50 p-4 rounded-xl text-emerald-300 font-bold text-sm">
                        ✨ 完美靜止
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Score Bar */}
              <div className="w-full bg-slate-950 rounded-xl p-3 border border-slate-800 z-10">
                <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                  <span>本局積分</span>
                  <span className="text-amber-400 font-mono">{player.roundScore}</span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-rose-500 h-full transition-all duration-300"
                    style={{ width: `${Math.min((player.roundScore / 1000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
