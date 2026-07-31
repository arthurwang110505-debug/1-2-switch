import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useMotionSensing } from '../hooks/useMotionSensing';
import { Room, GameItem, Player } from '../types';
import {
  Smartphone,
  Zap,
  Flame,
  ShieldCheck,
  Wifi,
  WifiOff,
  Sparkles,
  Trophy,
  Activity,
  AlertCircle,
  CheckCircle2,
  Volume2,
  RotateCw
} from 'lucide-react';

interface MobileControllerProps {
  socket: Socket | null;
  roomCodeFromUrl?: string;
}

export const MobileController: React.FC<MobileControllerProps> = ({
  socket,
  roomCodeFromUrl = ''
}) => {
  const [roomCode, setRoomCode] = useState<string>(roomCodeFromUrl);
  const [playerName, setPlayerName] = useState<string>('');
  const [joinedRoom, setJoinedRoom] = useState<Room | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [joinError, setJoinError] = useState<string>('');
  const [joyconTheme, setJoyconTheme] = useState<'neon_red' | 'neon_blue' | 'neon_purple' | 'oled_white'>('neon_red');
  const [testConfirmedFeedback, setTestConfirmedFeedback] = useState<boolean>(false);
  const [sensitivity, setSensitivity] = useState<'low' | 'medium' | 'high'>('medium');

  const currentGame: GameItem | undefined = joinedRoom?.playlist?.[joinedRoom.currentGameIndex];

  const {
    permissionGranted,
    needsPermissionButton,
    requestPermission,
    motionState,
    triggerVibrate
  } = useMotionSensing(
    socket,
    joinedRoom?.code || '',
    myPlayerId,
    currentGame?.mechanicType,
    joinedRoom?.gameState === 'playing',
    sensitivity
  );

  useEffect(() => {
    const defaultNames = ['馬力歐', '路易吉', '碧姬公主', '耀西', '庫巴', '瓦力歐', '奇諾比奧', '薩爾達'];
    const randomName = defaultNames[Math.floor(Math.random() * defaultNames.length)];
    setPlayerName(randomName);

    const themes: Array<'neon_red' | 'neon_blue' | 'neon_purple' | 'oled_white'> = [
      'neon_red', 'neon_blue', 'neon_purple', 'oled_white'
    ];
    setJoyconTheme(themes[Math.floor(Math.random() * themes.length)]);
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('game-state-update', (updatedRoom: Room) => {
      setJoinedRoom(updatedRoom);
    });

    socket.on('player-test-confirmed', (data: any) => {
      if (data.playerId === myPlayerId) {
        setTestConfirmedFeedback(true);
        triggerVibrate([100, 50, 100, 50, 100]);
        setTimeout(() => setTestConfirmedFeedback(false), 3000);
      }
    });

    socket.on('vibrate-feedback', (pattern: number[]) => {
      triggerVibrate(pattern || [100, 50, 100]);
    });

    return () => {
      socket.off('game-state-update');
      socket.off('player-test-confirmed');
      socket.off('vibrate-feedback');
    };
  }, [socket, myPlayerId, triggerVibrate]);

  const handleButtonPress = (btnName: string) => {
    triggerVibrate(50);
    if (!socket || !joinedRoom || !myPlayerId) return;

    if (btnName === 'SL' || btnName === 'SR' || btnName === 'TEST') {
      socket.emit('test-connection', {
        roomCode: joinedRoom.code,
        playerId: myPlayerId,
        buttonName: btnName
      });
      setTestConfirmedFeedback(true);
      setTimeout(() => setTestConfirmedFeedback(false), 3000);
    } else {
      socket.emit('controller-btn-press', {
        roomCode: joinedRoom.code,
        playerId: myPlayerId,
        button: btnName
      });
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket) {
      setJoinError('Socket 尚未建立連線，請重試！');
      return;
    }
    if (!roomCode.trim()) {
      setJoinError('請輸入 4 位數房間號碼');
      return;
    }
    if (!playerName.trim()) {
      setJoinError('請輸入您的玩家暱稱');
      return;
    }

    setIsJoining(true);
    setJoinError('');

    socket.emit(
      'join-room',
      { roomCode: roomCode.trim().toUpperCase(), playerName: playerName.trim() },
      (response: any) => {
        setIsJoining(false);
        if (response.success) {
          setJoinedRoom(response.room);
          setMyPlayerId(response.playerId);
          localStorage.setItem('joycon_player_id', response.playerId);
          localStorage.setItem('joycon_room_code', response.room.code);
          triggerVibrate([100, 50, 100]);
        } else {
          setJoinError(response.error || '加入房間失敗，請確認房號');
        }
      }
    );
  };

  const themeStyles = {
    neon_red: {
      bg: 'from-rose-600 via-rose-500 to-rose-700',
      border: 'border-rose-400',
      glow: 'shadow-rose-500/40',
      accent: 'bg-rose-500',
      text: 'text-rose-400'
    },
    neon_blue: {
      bg: 'from-cyan-600 via-sky-500 to-blue-700',
      border: 'border-cyan-300',
      glow: 'shadow-cyan-500/40',
      accent: 'bg-cyan-500',
      text: 'text-cyan-400'
    },
    neon_purple: {
      bg: 'from-purple-600 via-indigo-500 to-purple-800',
      border: 'border-purple-300',
      glow: 'shadow-purple-500/40',
      accent: 'bg-purple-500',
      text: 'text-purple-400'
    },
    oled_white: {
      bg: 'from-slate-200 via-slate-100 to-slate-300',
      border: 'border-slate-400',
      glow: 'shadow-slate-400/30',
      accent: 'bg-slate-800',
      text: 'text-slate-800'
    }
  }[joyconTheme];

  if (!joinedRoom || !myPlayerId) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-6 font-sans select-none relative overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-500 to-cyan-400 p-1 flex items-center justify-center mx-auto shadow-xl shadow-rose-500/20 mb-3">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center gap-1.5">
                <div className="w-4 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-slate-950 rounded-full" />
                </div>
                <div className="w-4 h-8 bg-cyan-400 rounded-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-slate-950 rounded-full" />
                </div>
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Nintendo Switch Joy-Con
            </h1>
            <p className="text-xs text-slate-400 font-bold mt-1">體感無線搖桿配對入口</p>
          </div>

          {needsPermissionButton && !permissionGranted && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center">
              <p className="text-xs text-amber-300 font-bold mb-3 flex items-center justify-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                iOS 系統需要授權體感陀螺儀權限：
              </p>
              <button
                type="button"
                onClick={requestPermission}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer shadow-md"
              >
                點擊允許 iOS 陀螺儀感應
              </button>
            </div>
          )}

          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                4 位數房間號碼
              </label>
              <input
                type="text"
                maxLength={4}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="例如: ABCD"
                className="w-full px-4 py-3.5 bg-slate-950 border border-slate-700/80 rounded-2xl text-center font-mono text-2xl font-black tracking-widest text-amber-400 focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                玩家暱稱
              </label>
              <input
                type="text"
                maxLength={10}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="輸入玩家名字"
                className="w-full px-4 py-3.5 bg-slate-950 border border-slate-700/80 rounded-2xl font-bold text-center text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {joinError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl text-center">
                {joinError}
              </div>
            )}

            <button
              type="submit"
              disabled={isJoining}
              className="w-full py-4 bg-gradient-to-r from-rose-500 via-amber-500 to-cyan-500 hover:opacity-90 text-slate-950 font-black text-lg rounded-2xl shadow-xl transition cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5 fill-current" />
              {isJoining ? 'Joy-Con 配對中...' : '連線 Joy-Con 控制器'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const myPlayer: Player | undefined = joinedRoom.players?.[myPlayerId];
  const isConnectionTested = myPlayer?.connectionTested || testConfirmedFeedback;
  const playerNumber = Object.keys(joinedRoom.players).indexOf(myPlayerId) + 1;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-3 sm:p-5 select-none font-sans relative overflow-hidden">
      {/* Top Header */}
      <header className="w-full max-w-md mx-auto space-y-2 z-20">
        {/* Shoulder Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {(['L', 'ZL', 'ZR', 'R'] as const).map((btn) => (
            <button
              key={btn}
              onTouchStart={() => handleButtonPress(btn)}
              onClick={() => handleButtonPress(btn)}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 border-b-4 border-slate-950 active:border-b-0 rounded-t-xl text-xs font-black text-slate-300 transition cursor-pointer flex items-center justify-center"
            >
              {btn === 'ZL' || btn === 'ZR' ? `${btn} 扳機` : `${btn} 鍵`}
            </button>
          ))}
        </div>

        {/* Connection Test Button */}
        <button
          onTouchStart={() => handleButtonPress('SL')}
          onClick={() => handleButtonPress('SL')}
          className={`w-full py-3.5 px-4 rounded-2xl border-2 font-black text-sm flex items-center justify-between transition-all duration-300 shadow-xl cursor-pointer ${
            isConnectionTested
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-emerald-500/20'
              : 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-amber-500/20 animate-pulse'
          }`}
        >
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-amber-400 animate-bounce" />
            <span>【連線測試】點擊 SL/SR 鍵</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-extrabold px-2.5 py-1 rounded-full bg-slate-950">
            {isConnectionTested ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">已確認</span>
              </>
            ) : (
              <span className="text-amber-400">點此測試</span>
            )}
          </div>
        </button>
      </header>

      {/* Main Controller */}
      <main className="w-full max-w-md mx-auto my-3 flex-1 flex flex-col justify-between items-center relative z-10">
        <div
          className={`w-full h-full min-h-[460px] rounded-[48px] bg-gradient-to-b ${themeStyles.bg} border-4 ${themeStyles.border} ${themeStyles.glow} shadow-2xl p-6 flex flex-col justify-between relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          {/* Minus/Plus + Player Info */}
          <div className="flex justify-between items-center z-10">
            <button
              onTouchStart={() => handleButtonPress('-')}
              onClick={() => handleButtonPress('-')}
              className="w-10 h-10 rounded-full bg-slate-900/80 border border-white/20 flex items-center justify-center font-black text-lg text-white hover:bg-slate-800 active:scale-90 transition cursor-pointer"
            >
              一
            </button>

            <div className="text-center bg-slate-950/70 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
              <span className="font-black text-sm text-white mr-2">{myPlayer?.name}</span>
              <span className="text-xs font-mono font-bold text-amber-400">{myPlayer?.score || 0} pts</span>
              <div className="flex justify-center gap-1.5 mt-1">
                {[1, 2, 3, 4].map((pNum) => (
                  <div
                    key={pNum}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      pNum === playerNumber
                        ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              onTouchStart={() => handleButtonPress('+')}
              onClick={() => handleButtonPress('+')}
              className="w-10 h-10 rounded-full bg-slate-900/80 border border-white/20 flex items-center justify-center font-black text-lg text-white hover:bg-slate-800 active:scale-90 transition cursor-pointer"
            >
              十
            </button>
          </div>

          {/* Center Activity Area */}
          <div className="my-4 flex flex-col items-center justify-center text-center z-10">
            {joinedRoom.gameState === 'practice' ? (
              <div className="w-full bg-slate-950/95 backdrop-blur-md p-4 rounded-3xl border-2 border-amber-400 shadow-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                    🧪 30s 練習
                  </span>
                  <span className="text-xs font-mono font-black text-amber-400">{joinedRoom.timerSeconds}s</span>
                </div>
                <div className="text-3xl mb-1">{currentGame?.icon}</div>
                <h3 className="text-base font-black text-white">{currentGame?.name}</h3>
                <p className="text-xs font-bold text-amber-200 my-1">{currentGame?.instruction}</p>
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-300 mb-1">
                    <span>體感力道</span>
                    <span className="text-amber-400 font-mono">{motionState.intensity}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-3.5 rounded-full p-0.5 border border-slate-700 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 h-full rounded-full transition-all duration-75"
                      style={{ width: `${motionState.intensity}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    triggerVibrate([100, 50, 100]);
                    socket?.emit('skip-practice', { roomCode: joinedRoom.code });
                  }}
                  className="w-full mt-3 py-2.5 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition cursor-pointer"
                >
                  練習完畢，開始比賽
                </button>
              </div>
            ) : joinedRoom.gameState === 'playing' ? (
              <div className="w-full bg-slate-950/80 backdrop-blur-md p-4 rounded-3xl border border-white/10 shadow-2xl">
                <div className="text-3xl mb-1">{currentGame?.icon}</div>
                <h3 className="text-lg font-black text-white">{currentGame?.name}</h3>
                <p className="text-xs font-bold text-amber-300 mt-1">{currentGame?.instruction}</p>
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                    <span>體感力道 (G-Force)</span>
                    <span className="text-amber-400 font-mono">{motionState.intensity}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-4 rounded-full p-0.5 border border-slate-700 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 h-full rounded-full transition-all duration-75"
                      style={{ width: `${motionState.intensity}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative my-2">
                <div className="w-28 h-28 rounded-full bg-slate-900 border-4 border-slate-800 shadow-2xl flex items-center justify-center p-2 relative">
                  <button
                    onTouchStart={() => handleButtonPress('STICK_PRESS')}
                    onClick={() => handleButtonPress('STICK_PRESS')}
                    className="w-20 h-20 rounded-full bg-gradient-to-b from-slate-700 to-slate-900 border-2 border-slate-600 shadow-inner flex items-center justify-center cursor-pointer active:scale-90 transition"
                  >
                    <div className="w-8 h-8 rounded-full border border-slate-500/50 flex items-center justify-center">
                      <div className="w-3 h-3 bg-slate-500 rounded-full" />
                    </div>
                  </button>
                </div>
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block mt-1">
                  Joy-Stick
                </span>
              </div>
            )}
          </div>

          {/* D-Pad + ABXY */}
          <div className="grid grid-cols-2 gap-4 items-center z-10">
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 relative flex items-center justify-center">
                <button onTouchStart={() => handleButtonPress('UP')} onClick={() => handleButtonPress('UP')} className="absolute top-0 w-9 h-9 bg-slate-900 hover:bg-slate-800 active:bg-slate-700 border border-slate-700 rounded-t-lg font-black text-xs text-white flex items-center justify-center cursor-pointer shadow-md">▲</button>
                <button onTouchStart={() => handleButtonPress('LEFT')} onClick={() => handleButtonPress('LEFT')} className="absolute left-0 w-9 h-9 bg-slate-900 hover:bg-slate-800 active:bg-slate-700 border border-slate-700 rounded-l-lg font-black text-xs text-white flex items-center justify-center cursor-pointer shadow-md">◀</button>
                <div className="w-9 h-9 bg-slate-900 border border-slate-800" />
                <button onTouchStart={() => handleButtonPress('RIGHT')} onClick={() => handleButtonPress('RIGHT')} className="absolute right-0 w-9 h-9 bg-slate-900 hover:bg-slate-800 active:bg-slate-700 border border-slate-700 rounded-r-lg font-black text-xs text-white flex items-center justify-center cursor-pointer shadow-md">▶</button>
                <button onTouchStart={() => handleButtonPress('DOWN')} onClick={() => handleButtonPress('DOWN')} className="absolute bottom-0 w-9 h-9 bg-slate-900 hover:bg-slate-800 active:bg-slate-700 border border-slate-700 rounded-b-lg font-black text-xs text-white flex items-center justify-center cursor-pointer shadow-md">▼</button>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-28 h-28 relative flex items-center justify-center">
                <button onTouchStart={() => handleButtonPress('X')} onClick={() => handleButtonPress('X')} className="absolute top-0 w-9 h-9 bg-slate-900 hover:bg-slate-800 active:bg-indigo-600 border border-slate-700 rounded-full font-black text-sm text-white flex items-center justify-center cursor-pointer shadow-md">X</button>
                <button onTouchStart={() => handleButtonPress('Y')} onClick={() => handleButtonPress('Y')} className="absolute left-0 w-9 h-9 bg-slate-900 hover:bg-slate-800 active:bg-indigo-600 border border-slate-700 rounded-full font-black text-sm text-white flex items-center justify-center cursor-pointer shadow-md">Y</button>
                <button onTouchStart={() => handleButtonPress('A')} onClick={() => handleButtonPress('A')} className="absolute right-0 w-10 h-10 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 border-2 border-white rounded-full font-black text-base text-slate-950 flex items-center justify-center cursor-pointer shadow-lg shadow-emerald-500/30">A</button>
                <button onTouchStart={() => handleButtonPress('B')} onClick={() => handleButtonPress('B')} className="absolute bottom-0 w-9 h-9 bg-slate-900 hover:bg-slate-800 active:bg-indigo-600 border border-slate-700 rounded-full font-black text-sm text-white flex items-center justify-center cursor-pointer shadow-md">B</button>
              </div>
            </div>
          </div>

          {/* Home & Capture */}
          <div className="flex justify-between items-center pt-2 border-t border-white/10 z-10">
            <button onTouchStart={() => handleButtonPress('CAPTURE')} onClick={() => handleButtonPress('CAPTURE')} className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-800 active:scale-90 transition cursor-pointer">
              <div className="w-3.5 h-3.5 border-2 border-slate-300 rounded-sm" />
            </button>
            <span className="text-[10px] font-black text-slate-900/80 uppercase tracking-widest">Switch Joy-Con</span>
            <button onTouchStart={() => handleButtonPress('HOME')} onClick={() => handleButtonPress('HOME')} className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-800 active:scale-90 transition cursor-pointer">
              <div className="w-3 h-3 rounded-full border-2 border-amber-400" />
            </button>
          </div>
        </div>
      </main>

      {/* Bottom: Theme & Sensitivity */}
      <footer className="w-full max-w-md mx-auto flex items-center justify-between text-xs text-slate-400 font-bold z-20">
        <div className="flex items-center gap-1.5">
          <RotateCw className="w-3.5 h-3.5 text-slate-500" />
          <span>配色:</span>
        </div>
        <div className="flex gap-2">
          {(['neon_red', 'neon_blue', 'neon_purple', 'oled_white'] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => setJoyconTheme(theme)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase transition cursor-pointer ${
                joyconTheme === theme
                  ? 'bg-slate-800 text-white border border-slate-600'
                  : 'bg-slate-900 text-slate-500 hover:text-slate-300'
              }`}
            >
              {theme.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span>感度:</span>
          {(['low', 'medium', 'high'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSensitivity(s)}
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition cursor-pointer ${
                sensitivity === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-500 hover:text-slate-300'
              }`}
            >
              {s === 'low' ? '低' : s === 'medium' ? '中' : '高'}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
};
