/**
 * 1-2-Switch Party Game Platform - Type Definitions
 */

export type MechanicType = 'shake' | 'tilt' | 'whip' | 'hold_still' | 'quick_draw';
export type DurationCategory = 'short' | 'long'; // short: 30-45s, long: 60-90s

export interface GameItem {
  id: string;
  name: string;
  description: string;
  durationCategory: DurationCategory;
  estimatedSeconds: number;
  mechanicType: MechanicType;
  icon: string; // Emoji or icon name
  instruction: string;
  targetHint: string;
  color: string; // Tailwind gradient/color class
  bgTheme: string;
}

export interface Player {
  id: string;
  socketId: string;
  name: string;
  avatar: string;
  color: string;
  score: number;
  roundScore: number;
  ready: boolean;
  connectionTested?: boolean; // 代表是否有在連線測試按鈕按過並與大螢幕確認
  lastTestTime?: number;
  joyconSide?: 'left' | 'right'; // 像 Switch 一樣的左/右 Joy-Con 色彩與圖示
  intensity: number; // Current live motion intensity (0 - 100)
  currentAngles: { alpha: number; beta: number; gamma: number };
  isEliminated?: boolean;
  quickDrawTime?: number | null; // Microseconds/ms for quick draw
  lastActionTime?: number;
}

export type GameState = 'lobby' | 'practice' | 'countdown' | 'playing' | 'game_result' | 'leaderboard';

export interface Room {
  code: string;
  hostSocketId: string;
  players: Record<string, Player>;
  targetMinutes: number;
  playlist: GameItem[];
  currentGameIndex: number;
  gameState: GameState;
  timerSeconds: number;
  signalActive?: boolean; // Used for quick_draw / buzzer games
  signalTime?: number; // Epoch timestamp when signal was fired
  gameData?: {
    customValue?: any;
    winnerId?: string;
  };
}

export interface MotionDataPayload {
  roomCode: string;
  playerId: string;
  mechanicType: MechanicType;
  intensity: number;
  acc: { x: number; y: number; z: number };
  rot: { alpha: number; beta: number; gamma: number };
  isSpecialTrigger?: boolean;
}

export interface PlayerActionPayload {
  roomCode: string;
  playerId: string;
  actionType: string;
  intensity: number;
  extraData?: any;
}
