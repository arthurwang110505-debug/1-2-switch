import { GameItem } from '../types';

/**
 * 模組 2：動態時間遊戲排程器 (Game Scheduler)
 * 演算法函式：接收遊戲庫與使用者選擇的總分鐘數，自動計算並挑選不重複的 70% 短遊戲 + 30% 長遊戲組合。
 *
 * @param gamesDb 20 種小遊戲資料庫
 * @param totalMinutes 目標遊戲總時間（例如 3 分鐘、5 分鐘、10 分鐘）
 * @returns 隨機且不重複的最佳遊戲歌單組合
 */
export function generatePlaylist(gamesDb: GameItem[], totalMinutes: number): GameItem[] {
  if (!gamesDb || gamesDb.length === 0) return [];

  const targetSeconds = totalMinutes * 60;

  // 1. 分類短遊戲 (30-45秒) 與長遊戲 (60-90秒)
  const shortGames = shuffleArray(gamesDb.filter((g) => g.durationCategory === 'short'));
  const longGames = shuffleArray(gamesDb.filter((g) => g.durationCategory === 'long'));

  const playlist: GameItem[] = [];
  let accumulatedSeconds = 0;
  const usedIds = new Set<string>();

  let shortIndex = 0;
  let longIndex = 0;

  // 緩衝區加成（加上每局之間 10 秒 transition / ready 時間）
  const OVERHEAD_PER_GAME = 10;

  // 當累積時間尚未接近目標秒數且還有遊戲可選時進行迴圈
  while (accumulatedSeconds < targetSeconds) {
    // 計算 70% / 30% 時間分配或數量比例
    // 隨機抽選或依據比例決定下一款選短遊戲還是長遊戲
    const currentRatioIsShort = Math.random() < 0.7;

    let selectedGame: GameItem | null = null;

    if (currentRatioIsShort && shortIndex < shortGames.length) {
      selectedGame = shortGames[shortIndex++];
    } else if (!currentRatioIsShort && longIndex < longGames.length) {
      selectedGame = longGames[longIndex++];
    } else if (shortIndex < shortGames.length) {
      selectedGame = shortGames[shortIndex++];
    } else if (longIndex < longGames.length) {
      selectedGame = longGames[longIndex++];
    }

    if (!selectedGame) break; // 所有遊戲均已使用

    if (!usedIds.has(selectedGame.id)) {
      playlist.push(selectedGame);
      usedIds.add(selectedGame.id);
      accumulatedSeconds += selectedGame.estimatedSeconds + OVERHEAD_PER_GAME;
    }

    // 如果時間已經超過目標時間的 90%，且下一個會嚴重超時，則適時結束選取
    if (accumulatedSeconds >= targetSeconds * 0.95) {
      break;
    }
  }

  // 防呆：如果最少未選滿 2 款遊戲，強制補充
  if (playlist.length < 2 && gamesDb.length >= 2) {
    for (const game of gamesDb) {
      if (!usedIds.has(game.id)) {
        playlist.push(game);
        usedIds.add(game.id);
        if (playlist.length >= 2) break;
      }
    }
  }

  return playlist;
}

/**
 * Fisher-Yates 陣列隨機洗牌演算法
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
