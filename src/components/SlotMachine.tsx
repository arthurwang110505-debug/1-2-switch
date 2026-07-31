import React, { useState, useEffect, useRef } from 'react';
import { GameItem } from '../types';

interface SlotMachineProps {
  games: GameItem[];
  totalGames: number;
  isSpinning?: boolean;
  onSpinComplete?: () => void;
}

/**
 * Slot Machine / 老虎機遊戲選擇動畫
 * 當選擇時間或重新洗牌時，展示老虎機滾動效果
 */
export const SlotMachine: React.FC<SlotMachineProps> = ({
  games,
  totalGames,
  isSpinning = false,
  onSpinComplete
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpinningLocal, setIsSpinningLocal] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speedRef = useRef(80);

  useEffect(() => {
    if (isSpinning && games.length > 0) {
      setIsSpinningLocal(true);
      let speed = 50;
      let steps = 0;
      const totalSteps = 30 + Math.floor(Math.random() * 20);

      intervalRef.current = setInterval(() => {
        steps++;
        // Slow down as we approach the end
        if (steps > totalSteps - 10) {
          speed = Math.min(speed + 20, 300);
        }
        setCurrentIndex(prev => (prev + 1) % games.length);

        if (steps >= totalSteps) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsSpinningLocal(false);
          onSpinComplete?.();
        }
      }, speed);
    } else {
      setIsSpinningLocal(false);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSpinning, games.length, onSpinComplete]);

  if (games.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <div className="text-4xl mb-2">🎰</div>
        <p className="text-sm font-bold">尚未選擇遊戲時間</p>
      </div>
    );
  }

  // Show a preview strip of games
  const previewGames = games.slice(0, Math.min(totalGames, 6));

  return (
    <div className="space-y-3">
      {/* Slot machine display */}
      <div className="relative bg-slate-950 rounded-2xl border-2 border-amber-500/30 p-4 overflow-hidden">
        {/* Decorative lights */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

        {/* Spinning animation overlay */}
        {isSpinningLocal && (
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/80 via-purple-950/60 to-indigo-950/80 z-10 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl animate-bounce mb-2">🎰</div>
              <div className="text-amber-400 font-black text-lg tracking-widest animate-pulse">
                洗牌中...
              </div>
            </div>
          </div>
        )}

        {/* Game icons preview */}
        <div className="flex gap-2 justify-center flex-wrap">
          {previewGames.map((game, idx) => (
            <div
              key={`${game.id}-${idx}`}
              className={`
                w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                border-2 transition-all duration-300
                ${isSpinningLocal
                  ? 'opacity-50 scale-90 border-slate-700'
                  : 'opacity-100 scale-100 border-amber-500/40 bg-slate-900/80'
                }
              `}
            >
              {game.icon}
            </div>
          ))}
        </div>

        {/* Total count badge */}
        <div className="mt-3 flex justify-center">
          <div className="bg-gradient-to-r from-amber-500 to-rose-500 px-4 py-1 rounded-full">
            <span className="text-white font-black text-sm">
              {previewGames.length} 款遊戲
            </span>
          </div>
        </div>
      </div>

      {/* Slot machine lever decoration */}
      <div className="flex justify-center gap-1">
        {Array.from({ length: Math.min(games.length, 10) }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isSpinningLocal
                ? 'bg-amber-400 animate-pulse'
                : 'bg-slate-700'
            }`}
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    </div>
  );
};

// 老虎機樣式按鈕
export const SlotMachineButton: React.FC<{
  onClick: () => void;
  minutes: number;
  gameCount: number;
  isSelected?: boolean;
  icon?: string;
  soundEnabled?: boolean;
}> = ({ onClick, minutes, gameCount, isSelected = false, icon = '⏱️', soundEnabled = true }) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl p-4 transition-all duration-300
        ${isSelected
          ? 'bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow-xl shadow-amber-500/30 scale-105'
          : 'bg-slate-800/90 border-2 border-slate-700 hover:border-amber-500/50 text-slate-200 hover:bg-slate-750'
        }
      `}
    >
      {/* Slot machine strip decoration */}
      <div className={`absolute top-0 left-0 w-full h-1 ${isSelected ? 'bg-white/30' : 'bg-amber-500/20'}`} />

      <div className="text-center">
        <div className={`text-3xl mb-1 ${isSelected ? 'animate-bounce' : ''}`}>{icon}</div>
        <div className="font-black text-lg">{minutes} 分鐘</div>
        <div className={`text-xs font-bold mt-1 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
          ~{gameCount} 款遊戲
        </div>
      </div>

      {/* Sparkle effect on selected */}
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-amber-300 text-xs animate-pulse"
              style={{
                left: `${15 + i * 18}%`,
                top: '10%',
                animationDelay: `${i * 100}ms`
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}
    </button>
  );
};
