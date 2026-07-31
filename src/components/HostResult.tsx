import React, { useState } from 'react';
import { Room, GameItem, Player } from '../types';
import { Clock } from 'lucide-react';
import { GameRulesModal } from './GameRulesModal';

interface HostResultProps {
  room: Room;
  currentGame?: GameItem;
  onOpenRules: (game: GameItem) => void;
}

export const HostResult: React.FC<HostResultProps> = ({ room, currentGame, onOpenRules }) => {
  const [selectedGameForRules, setSelectedGameForRules] = useState<GameItem | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);

  const handleOpenRules = (game: GameItem) => {
    setSelectedGameForRules(game);
    setIsRulesModalOpen(true);
  };

  const playersList: Player[] = Object.values(room.players);
  const sortedPlayers: Player[] = [...playersList].sort((a, b) => b.roundScore - a.roundScore);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-8 select-none font-sans">
      <GameRulesModal
        game={selectedGameForRules}
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      <div className="max-w-3xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
        <div className="text-4xl mb-2">{currentGame?.icon}</div>
        <h2 className="text-3xl font-black text-amber-400 mb-1">{currentGame?.name} - 成績結算</h2>
        <p className="text-slate-400 text-sm font-medium mb-8">準備進入下一款遊戲！</p>

        <div className="space-y-4 my-6">
          {sortedPlayers.map((player: Player, index) => (
            <div
              key={player.id}
              className="flex items-center justify-between bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 shadow-md"
            >
              <div className="flex items-center gap-4">
                <span className={`text-2xl font-black w-8 font-mono ${index === 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  #{index + 1}
                </span>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold border border-white/20"
                  style={{ backgroundColor: player.color }}
                >
                  {player.avatar}
                </div>
                <span className="font-extrabold text-lg text-white">{player.name}</span>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-bold">本局獲得</div>
                  <div className="text-xl font-black text-amber-400 font-mono">+{player.roundScore}</div>
                </div>
                <div className="text-right min-w-[80px]">
                  <div className="text-xs text-slate-400 font-bold">總積分</div>
                  <div className="text-xl font-black text-emerald-400 font-mono">{player.score}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-slate-400 text-xs font-semibold mt-6 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-amber-400 animate-spin" />
          即將進入下一局...
        </div>
      </div>
    </div>
  );
};
