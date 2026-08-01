import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { HostScreen } from './components/HostScreen';
import { MobileController } from './components/MobileController';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Room } from './types';
import { Tv, Smartphone, Gamepad2, Sparkles, Trophy, Zap, WifiOff, Wifi, AlertCircle } from 'lucide-react';

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [mode, setMode] = useState<'select' | 'host' | 'controller'>('select');
  const [room, setRoom] = useState<Room | null>(null);
  const [roomCode, setRoomCode] = useState<string>('');
  const [roomCodeFromUrl, setRoomCodeFromUrl] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // 1. 初始化 Socket.io 連線與自動指數退避重連 (Exponential Backoff Reconnection)
  useEffect(() => {
    // 支援 VITE_SOCKET_URL 環境變數指定 Socket.io 後端位址
    // 不設定時預設連接同一來源 (same-origin)，適合 local dev 或分離部署
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

    const newSocket = io(socketUrl, {
      transports: ['polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 20000,
      withCredentials: false
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected to server:', newSocket.id);
      setConnectionStatus('connected');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      setConnectionStatus('disconnected');
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`[Socket] Reconnected successfully after ${attemptNumber} attempts`);
      // 如果之前已經在大廳或控制頁，自動恢復 Sessions
      const storedPlayerId = localStorage.getItem('joycon_player_id');
      const storedRoomCode = localStorage.getItem('joycon_room_code');
      if (storedPlayerId && storedRoomCode) {
        newSocket.emit('reconnect-player', { roomCode: storedRoomCode, playerId: storedPlayerId }, (res: any) => {
          if (res?.success) {
            setRoom(res.room);
          }
        });
      }
    });

    newSocket.on('reconnect_attempt', (attempt) => {
      console.log(`[Socket] Reconnect attempt #${attempt} with exponential backoff...`);
    });

    setSocket(newSocket);

    // 自動解析網址 URL Query Parameters: ?room=ABCD
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');

    if (roomParam) {
      setRoomCodeFromUrl(roomParam.toUpperCase());
      setMode('controller'); // 若由 QR Code 網址點擊進來，自動優先進入控制器模式
    }

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 2. 監聽 Socket 房間更新與狀態廣播
  useEffect(() => {
    if (!socket) return;

    socket.on('game-state-update', (updatedRoom: Room) => {
      console.log('[Socket] game-state-update received, new gameState:', updatedRoom.gameState);
      setRoom(updatedRoom);
    });

    return () => {
      socket.off('game-state-update');
    };
  }, [socket]);

  // 大螢幕 Host 選擇：自動發起建立新房間
  const handleSelectHost = () => {
    console.log('[App] handleSelectHost called');
    if (!socket) return;
    setMode('host');
    socket.emit('create-room', (response: any) => {
      console.log('[App] create-room response:', response);
      if (response.success) {
        setRoomCode(response.roomCode);
        setRoom(response.room);
      }
    });
  };

  // 控制器 Controller 選擇
  const handleSelectController = () => {
    setMode('controller');
  };

  // 1. 手機控制器介面
  if (mode === 'controller') {
    return <MobileController socket={socket} roomCodeFromUrl={roomCodeFromUrl} />;
  }

  // 2. 大螢幕 Host 介面
  if (mode === 'host') {
    return socket ? (
      <HostScreen socket={socket} room={room} roomCode={roomCode} />
    ) : (
      <div className="min-h-screen bg-slate-950 text-white flex justify-center items-center font-bold">
        連線中...
      </div>
    );
  }

  // 3. 初始選擇模式畫面 (大螢幕 TV vs 手機 Joy-Con)
  // 先檢查連線狀態
  if (connectionStatus === 'disconnected') {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950 to-slate-900 text-white flex flex-col justify-center items-center p-6 font-sans select-none relative overflow-hidden">
        <div className="max-w-md w-full text-center z-10">
          <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center mx-auto mb-6">
            <WifiOff className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-3xl font-black text-red-400 mb-4">連線失敗</h1>
          <p className="text-slate-300 mb-2">無法連線到遊戲伺服器</p>
          {import.meta.env.VITE_SOCKET_URL && (
            <p className="text-xs text-slate-500 font-mono mb-6 break-all">
              目標: {import.meta.env.VITE_SOCKET_URL}
            </p>
          )}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-left mb-6">
            <div className="flex items-center gap-2 text-amber-400 font-bold mb-3">
              <AlertCircle className="w-5 h-5" />
              解決方案
            </div>
            <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
              <li>確認 Socket.io 後端伺服器已上線</li>
              <li>檢查 <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">VITE_SOCKET_URL</code> 是否正確設定</li>
              <li>本地開發請確保後端伺服器已啟動</li>
              <li>部署環境請參閱 <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">DEPLOYMENT.md</code></li>
            </ol>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold transition cursor-pointer"
          >
            重新整理頁面
          </button>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'connecting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white flex flex-col justify-center items-center font-sans select-none">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xl font-bold tracking-wide">正在連線到伺服器...</p>
        <p className="text-sm text-slate-400 mt-2">
          {import.meta.env.VITE_SOCKET_URL ? import.meta.env.VITE_SOCKET_URL : 'localhost:3000'}
        </p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white flex flex-col justify-center items-center p-6 font-sans select-none relative overflow-hidden">
      {/* 背景炫彩派對光斑 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-700" />

      <div className="max-w-2xl w-full text-center z-10">
        {/* 大標題 */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500/20 to-amber-500/20 border border-rose-500/30 px-5 py-2 rounded-full text-rose-300 font-extrabold text-sm mb-6">
          <Sparkles className="w-4 h-4 text-amber-400" />
          無主機雙屏互動體感派對平台
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4 bg-gradient-to-r from-rose-400 via-amber-300 to-indigo-300 bg-clip-text text-transparent">
          1-2-SWITCH 派對擂台
        </h1>
        <p className="text-slate-300 text-base sm:text-lg font-medium mb-12 max-w-lg mx-auto leading-relaxed">
          電腦/電視大螢幕做為遊玩主舞台，手機瀏覽器即刻化身 Joy-Con 體感感應控制器！
        </p>

        {/* 模式雙選一卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* 大螢幕 Host 卡片 */}
          <button
            onClick={handleSelectHost}
            className="group bg-slate-900/80 hover:bg-slate-900 border-2 border-slate-800 hover:border-indigo-500 p-8 rounded-3xl transition-all duration-300 text-left flex flex-col justify-between shadow-xl hover:shadow-indigo-500/20 cursor-pointer transform hover:-translate-y-1"
          >
            <div>
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition duration-300 mb-6">
                <Tv className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">大螢幕端 (Host)</h2>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                適合開啟在大電視或電腦螢幕上。顯示遊戲號碼 QRCode、規則動畫、倒數計時與即時排行榜。
              </p>
            </div>
            <div className="mt-8 flex items-center gap-2 text-indigo-400 font-extrabold text-sm group-hover:translate-x-1 transition duration-200">
              <span>建立遊戲派對房</span>
              <span>→</span>
            </div>
          </button>

          {/* 手機 Joy-Con 卡片 */}
          <button
            onClick={handleSelectController}
            className="group bg-slate-900/80 hover:bg-slate-900 border-2 border-slate-800 hover:border-rose-500 p-8 rounded-3xl transition-all duration-300 text-left flex flex-col justify-between shadow-xl hover:shadow-rose-500/20 cursor-pointer transform hover:-translate-y-1"
          >
            <div>
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition duration-300 mb-6">
                <Smartphone className="w-9 h-9 animate-bounce" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">手機 Joy-Con 控制器</h2>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                玩家用手機開啟做為體感控制器。支援 iOS 陀螺儀、加速度計動作捕捉與觸覺震動。
              </p>
            </div>
            <div className="mt-8 flex items-center gap-2 text-rose-400 font-extrabold text-sm group-hover:translate-x-1 transition duration-200">
              <span>加入遊戲房間</span>
              <span>→</span>
            </div>
          </button>
        </div>

        {/* 底部說明 */}
        <div className="mt-12 text-xs text-slate-500 font-semibold">
          💡 提示：支援包含 20 種動作捕捉小遊戲、動態時間排程器與即時 Socket 狀態同步。
        </div>
      </div>
    </div>
  );
}
