import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import QRCode from 'qrcode';
import { Room, GameItem, Player } from '../types';
import { playSound } from '../utils/audioSynth';
import { GameRulesModal } from './GameRulesModal';
import { SlotMachine, SlotMachineButton } from './SlotMachine';
import { Users, Clock, Sparkles, Play, Volume2, QrCode, Smartphone, Activity, CheckCircle2, Gamepad2, Tv, RefreshCw } from 'lucide-react';

interface HostLobbyProps {
  socket: Socket;
  room: Room;
  roomCode: string;
  onStartTime: (minutes: number) => void;
  onStartGame: () => void;
  onOpenRules: (game: GameItem) => void;
}

export const HostLobby: React.FC<HostLobbyProps> = ({
  socket, room, roomCode, onStartTime, onStartGame, onOpenRules
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedGameForRules, setSelectedGameForRules] = useState<GameItem | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [lastTestedPlayer, setLastTestedPlayer] = useState<string>('');
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const shufleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate QR code
  useEffect(() => {
    if (!roomCode) return;
    const joinUrl = `${window.location.protocol}//${window.location.host}?room=${roomCode}`;
    QRCode.toDataURL(joinUrl, {
      width: 280,
      margin: 2,
      color: { dark: '#020617', light: '#ffffff' }
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error(err));
  }, [roomCode]);

  // Listen for connection test confirmations
  useEffect(() => {
    if (!socket) return;

    const handleTestConfirmed = (data: { playerId: string; playerName: string; buttonName: string }) => {
      if (soundEnabled) playSound.success();
      setLastTestedPlayer(data.playerId);
      setTimeout(() => setLastTestedPlayer(''), 3000);
    };

    const handleRemoteBtnClick = (data: { playerId: string; button: string }) => {
      if (soundEnabled) playSound.beep(700, 0.05);
    };

    socket.on('player-test-confirmed', handleTestConfirmed);
    socket.on('remote-btn-click', handleRemoteBtnClick);

    return () => {
      socket.off('player-test-confirmed', handleTestConfirmed);
      socket.off('remote-btn-click', handleRemoteBtnClick);
    };
  }, [socket, soundEnabled]);

  // 當歌單更新時觸發洗牌動畫
  useEffect(() => {
    if (room.playlist && room.playlist.length > 0 && !isShuffling) {
      setIsShuffling(true);
      shufleTimeoutRef.current = setTimeout(() => setIsShuffling(false), 2500);
    }
    return () => {
      if (shufleTimeoutRef.current) clearTimeout(shufleTimeoutRef.current);
    };
  }, [room.playlist?.length, isShuffling]);

  const playersList: Player[] = Object.values(room.players || {});
  const allTested = playersList.length > 0 && playersList.every(p => p.connectionTested);

  const handleOpenRules = (game: GameItem) => {
    if (soundEnabled) playSound.beep(800, 0.05);
    setSelectedGameForRules(game);
    setIsRulesModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white flex flex-col p-6 sm:p-8 font-sans relative overflow-hidden select-none">
      <GameRulesModal
        game={selectedGameForRules}
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        onStartGame={onStartGame}
      />

      {/* Background effects */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Header */}
      <header className="flex justify-between items-center mb-6 z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-rose-500 to-amber-500 rounded-2xl shadow-lg shadow-rose-500/30">
            <Gamepad2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-rose-400 via-purple-300 to-amber-300 bg-clip-text text-transparent">
              1-2-SWITCH 派對擂台
            </h1>
            <p className="text-slate-400 text-sm font-medium">無需主機 · 手機即是 Joy-Con 體感控制器</p>
          </div>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-300 hover:text-white transition flex items-center gap-2 text-sm font-semibold cursor-pointer"
        >
          <Volume2 className={`w-5 h-5 ${soundEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
          {soundEnabled ? '音效開啟' : '靜音'}
        </button>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 z-10">
        {/* Left: Room Code & QR */}
        <div className="lg:col-span-5 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold tracking-widest text-indigo-400 uppercase bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
                即時加入房間
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                伺服器在線
              </span>
            </div>

            <div className="bg-gradient-to-r from-slate-950 to-indigo-950 p-5 rounded-2xl border border-indigo-500/30 text-center shadow-inner my-3">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">ROOM CODE</div>
              <div className="text-5xl sm:text-6xl font-black tracking-widest text-amber-400 font-mono drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                {roomCode}
              </div>
            </div>

            {qrCodeUrl && (
              <div className="flex flex-col items-center justify-center my-4">
                <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-indigo-400/30 hover:scale-105 transition-transform duration-300">
                  <img src={qrCodeUrl} alt="Join QR Code" className="w-44 h-44 rounded-lg" />
                </div>
                <p className="text-xs text-slate-300 font-bold mt-3 flex items-center gap-1.5 bg-slate-950/80 px-4 py-1.5 rounded-full border border-slate-800">
                  <QrCode className="w-4 h-4 text-indigo-400" />
                  手機相機掃碼即可自動化身 Joy-Con
                </p>
              </div>
            )}
          </div>

          {/* Time Selector with Slot Machine Animation */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                派對總時間：
              </label>
              <button
                onClick={() => {
                  if (soundEnabled) playSound.whip();
                  // Force reshuffle
                  const mins = room.targetMinutes || 5;
                  onStartTime(mins);
                }}
                className="text-xs font-bold text-slate-400 hover:text-amber-400 transition flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                重新洗牌
              </button>
            </div>

            {/* Slot Machine Preview */}
            <SlotMachine
              games={room.playlist || []}
              totalGames={room.playlist?.length || 0}
              isSpinning={isShuffling}
            />

            <div className="grid grid-cols-3 gap-2 mt-3">
              {[3, 5, 10].map((mins) => {
                const isSelected = room.targetMinutes === mins;
                const gameCount = mins === 3 ? 4 : mins === 5 ? 8 : 15;
                return (
                  <SlotMachineButton
                    key={mins}
                    minutes={mins}
                    gameCount={gameCount}
                    isSelected={isSelected}
                    icon={mins === 3 ? '⚡' : mins === 5 ? '🎮' : '🏆'}
                    soundEnabled={soundEnabled}
                    onClick={() => {
                      if (soundEnabled) playSound.beep(600, 0.08);
                      setIsShuffling(true);
                      onStartTime(mins);
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Players */}
        <div className="lg:col-span-7 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-400" />
                已加入玩家 ({playersList.length} 人)
              </h2>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                ⚡ 玩家請按手機 SL/SR 鍵確認連線
              </span>
            </div>

            {playersList.length === 0 ? (
              <div className="border-2 border-dashed border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center my-6">
                <div className="w-16 h-16 rounded-full bg-slate-800/60 flex items-center justify-center mb-3 text-slate-500 animate-bounce">
                  <Smartphone className="w-8 h-8" />
                </div>
                <p className="text-base font-bold text-slate-300 mb-1">等待玩家連線中...</p>
                <p className="text-xs text-slate-500 max-w-sm">
                  請用手機掃描左側 QRCode，加入後可按下手機上的 SL/SR 鍵確認實體連線！
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3 max-h-[320px] overflow-y-auto pr-1">
                {playersList.map((player, idx) => {
                  const isJustTested = lastTestedPlayer === player.id;
                  const isTested = player.connectionTested || isJustTested;

                  return (
                    <div
                      key={player.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-md transition-all duration-300 ${
                        isJustTested
                          ? 'bg-emerald-950/90 border-emerald-400 shadow-emerald-500/30 scale-105'
                          : isTested
                          ? 'bg-slate-800/90 border-emerald-500/50'
                          : 'bg-slate-800/60 border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black shadow-md border border-white/20"
                          style={{ backgroundColor: player.color || '#6366f1' }}
                        >
                          {player.avatar || '🎮'}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-100 text-sm">{player.name}</div>
                          <div className="text-[11px] font-bold text-slate-400">P{idx + 1} Joy-Con</div>
                        </div>
                      </div>

                      <div className="text-right">
                        {isTested ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-extrabold animate-pulse">
                            <Activity className="w-3.5 h-3.5 text-amber-400" />
                            待測試
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Game Playlist Preview with Slot Machine Style */}
            {room.playlist && room.playlist.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  遊戲歌單 (點擊查看規則)
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {room.playlist.map((game, i) => (
                    <button
                      key={`${game.id}-${i}`}
                      onClick={() => onOpenRules(game)}
                      className="shrink-0 group relative bg-slate-800/90 hover:bg-slate-700 border-2 border-slate-700/80 hover:border-amber-500/60 px-3 py-2.5 rounded-xl flex flex-col items-center gap-1.5 text-xs font-bold text-slate-200 transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-amber-500/10"
                    >
                      {/* Slot machine number badge */}
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-br from-amber-500 to-rose-500 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md">
                        {i + 1}
                      </div>
                      <span className="text-2xl group-hover:animate-bounce transition-transform">{game.icon}</span>
                      <span className="text-[10px] font-bold text-slate-300 text-center leading-tight">{game.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Start Game Button */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                if (playersList.length === 0) {
                  alert('請至少等待一名玩家以手機 Joy-Con 加入房間！');
                  return;
                }
                if (soundEnabled) playSound.success();
                onStartGame();
              }}
              disabled={playersList.length === 0}
              className={`w-full py-4 rounded-2xl font-black text-lg tracking-wider flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer shadow-xl ${
                playersList.length > 0
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99]'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Play className="w-6 h-6 fill-current" />
              開啟派對擂台 ({playersList.length} 人 Ready)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
