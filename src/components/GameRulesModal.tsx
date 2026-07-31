import React from 'react';
import { GameItem } from '../types';
import { X, Clock, Target, Zap, ShieldAlert, Sparkles, Smartphone } from 'lucide-react';

interface GameRulesModalProps {
  game: GameItem | null;
  isOpen: boolean;
  onClose: () => void;
  onStartGame?: () => void;
}

export const GameRulesModal: React.FC<GameRulesModalProps> = ({
  game,
  isOpen,
  onClose,
  onStartGame
}) => {
  if (!isOpen || !game) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-white overflow-hidden">
        {/* 背景裝飾光斑 */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 關閉按鈕 */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 遊戲 Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-4xl shadow-lg shadow-rose-500/20">
            {game.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wide">
                {game.durationCategory === 'short' ? '短局 30-45秒' : '長局 60-90秒'}
              </span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wide">
                動作機制: {game.mechanicType}
              </span>
            </div>
            <h3 className="text-2xl font-black text-white">{game.name}</h3>
          </div>
        </div>

        {/* 規則說明 */}
        <div className="space-y-4 mb-8">
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> 遊戲核心玩法 (Rules)
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed">{game.description}</p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" /> 手機 Joy-Con 動作指示 (Movement Guide)
            </h4>
            <p className="text-base font-extrabold text-amber-200">{game.instruction}</p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Target className="w-4 h-4" /> 得分評定機制 (Target)
            </h4>
            <p className="text-sm text-slate-300 font-medium">{game.targetHint}</p>
          </div>
        </div>

        {/* 底部操作按鈕 */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition cursor-pointer text-sm"
          >
            關閉說明
          </button>
          {onStartGame && (
            <button
              onClick={() => {
                onClose();
                onStartGame();
              }}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-extrabold transition cursor-pointer text-sm shadow-lg shadow-emerald-500/20"
            >
              立刻開始此遊戲
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
