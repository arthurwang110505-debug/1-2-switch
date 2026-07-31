import React from 'react';
import { Room, Player } from '../types';
import { Trophy, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSound } from '../utils/audioSynth';

interface HostLeaderboardProps {
  room: Room;
  onPlayAgain: () => void;
  soundEnabled: boolean;
}

export const HostLeaderboard: React.FC<HostLeaderboardProps> = ({ room, onPlayAgain, soundEnabled }) => {
  const playersList: Player[] = Object.values(room.players);
  const finalRankings: Player[] = [...playersList].sort((a, b) => b.score - a.score);
  const winner = finalRankings[0];

  // Trigger confetti and victory sound
  React.useEffect(() => {
    if (soundEnabled) playSound.victory();
    confetti({
      particleCount: 140,
      spread: 90,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-purple-950 text-white flex flex-col items-center justify-center p-8 select-none font-sans relative overflow-hidden">
      {/* Winner Podium */}
      <div className="text-center mb-8 z-10">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 rounded-full text-amber-400 text-sm font-extrabold mb-3">
          <Trophy className="w-5 h-5 text-amber-400" />
          1-2-SWITCH 派對擂台 · 最終總結算
        </div>
        <h1 className="text-5xl font-black tracking-tight text-white">派對王者誕生！</h1>
      </div>

      {winner && (
        <div className="bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 border-2 border-amber-400/60 rounded-3xl p-8 max-w-xl w-full text-center shadow-2xl my-4 z-10 relative backdrop-blur-md">
          <div className="w-24 h-24 rounded-full bg-amber-400 mx-auto flex items-center justify-center text-5xl shadow-xl border-4 border-white mb-3 animate-bounce">
            {winner.avatar}
          </div>
          <h2 className="text-3xl font-black text-amber-300 mb-1">{winner.name}</h2>
          <p className="text-amber-200/80 font-bold text-sm">奪得全場最高分總冠軍 👑</p>
          <div className="text-5xl font-black text-white font-mono my-3">{winner.score} pts</div>
        </div>
      )}

      {/* Full Rankings */}
      <div className="max-w-xl w-full space-y-3 my-4 z-10">
        {finalRankings.map((player: Player, rank) => (
          <div
            key={player.id}
            className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm"
          >
            <div className="flex items-center gap-4">
              <span className={`text-xl font-black font-mono w-8 ${
                rank === 0 ? 'text-amber-400' : rank === 1 ? 'text-slate-300' : 'text-amber-700'
              }`}>
                #{rank + 1}
              </span>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold"
                style={{ backgroundColor: player.color }}
              >
                {player.avatar}
              </div>
              <span className="font-extrabold text-slate-100 text-base">{player.name}</span>
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">{player.score} pts</div>
          </div>
        ))}
      </div>

      {/* Play Again */}
      <div className="mt-6 z-10">
        <button
          onClick={onPlayAgain}
          className="py-4 px-10 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-black text-xl shadow-xl shadow-rose-500/20 flex items-center gap-3 transition cursor-pointer hover:scale-105 active:scale-95"
        >
          <RotateCcw className="w-6 h-6" />
          再玩一次
        </button>
      </div>
    </div>
  );
};
