/**
 * server/gameplay.ts — Scoring logic per mechanic type
 * Handles point calculation, combo system, anti-cheat validation
 */

import { Room, Player, MechanicType, GameItem } from '../src/types.js';

interface ScoreResult {
  scoreGained: number;
  penalty?: number;
  isFalseStart?: boolean;
  comboMultiplier?: number;
}

/**
 * Combo tracking per player
 */
interface ComboState {
  consecutiveHighScore: number;
  multiplier: number;
  lastScoreTime: number;
}

const comboState: Record<string, ComboState> = {};
const COMBO_HIGH_THRESHOLD = 15; // Minimum score to count as "high" for combo
const COMBO_RESET_TIME = 5000; // Reset combo if gap > 5s

export function getComboState(playerId: string): ComboState {
  if (!comboState[playerId]) {
    comboState[playerId] = { consecutiveHighScore: 0, multiplier: 1.0, lastScoreTime: 0 };
  }
  return comboState[playerId];
}

export function resetCombos(): void {
  for (const key in comboState) {
    comboState[key] = { consecutiveHighScore: 0, multiplier: 1.0, lastScoreTime: 0 };
  }
}

/**
 * Validate motion data for anti-cheat
 */
export function isValidMotionData(intensity: number, acc: { x: number; y: number; z: number }): boolean {
  // Physical limit check: max reasonable g-force is ~20g
  const gForce = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
  if (gForce > 25) return false;
  // Intensity should be 0-100
  if (intensity < 0 || intensity > 100) return false;
  return true;
}

/**
 * Shake scoring with consistency multiplier
 */
function scoreShake(player: Player, intensity: number, combo: ComboState): ScoreResult {
  if (intensity > 20) {
    let baseScore = Math.round(intensity * 0.3);

    // Consistency bonus: if player has been active for a while, add rhythm bonus
    if (intensity > 40) baseScore = Math.round(baseScore * 1.2);
    if (intensity > 70) baseScore = Math.round(baseScore * 1.3);

    // Apply combo multiplier
    baseScore = Math.round(baseScore * combo.multiplier);

    // Update combo
    if (baseScore >= COMBO_HIGH_THRESHOLD) {
      combo.consecutiveHighScore++;
      if (combo.consecutiveHighScore >= 5) combo.multiplier = 2.0;
      else if (combo.consecutiveHighScore >= 3) combo.multiplier = 1.5;
    } else {
      combo.consecutiveHighScore = 0;
      combo.multiplier = 1.0;
    }
    combo.lastScoreTime = Date.now();

    return { scoreGained: baseScore, comboMultiplier: combo.multiplier };
  }
  return { scoreGained: 0 };
}

/**
 * Whip scoring with power bands
 */
function scoreWhip(player: Player, intensity: number, isSpecialTrigger: boolean, combo: ComboState): ScoreResult {
  if (isSpecialTrigger || intensity > 50) {
    let powerMultiplier: number;
    if (intensity > 80) powerMultiplier = 2.0;      // Maximum power
    else if (intensity > 65) powerMultiplier = 1.5; // High power
    else powerMultiplier = 1.0;                      // Medium power

    let baseScore = Math.round(intensity * 1.5 * powerMultiplier);

    // Apply combo multiplier
    baseScore = Math.round(baseScore * combo.multiplier);

    // Update combo
    if (baseScore >= COMBO_HIGH_THRESHOLD) {
      combo.consecutiveHighScore++;
      if (combo.consecutiveHighScore >= 5) combo.multiplier = 2.0;
      else if (combo.consecutiveHighScore >= 3) combo.multiplier = 1.5;
    } else {
      combo.consecutiveHighScore = 0;
      combo.multiplier = 1.0;
    }
    combo.lastScoreTime = Date.now();

    return { scoreGained: baseScore, comboMultiplier: combo.multiplier };
  }
  return { scoreGained: 0 };
}

/**
 * Tilt scoring with precision tiers
 */
function scoreTilt(player: Player, rot: { alpha: number; beta: number; gamma: number }, combo: ComboState): ScoreResult {
  const angleDiff = Math.abs(rot?.gamma || 0);

  let points: number;
  if (angleDiff <= 3) points = 20;           // Perfect center
  else if (angleDiff <= 7) points = 15;      // Very close
  else if (angleDiff <= 12) points = 10;     // Close
  else if (angleDiff <= 15) points = 8;      // Acceptable
  else {
    // Overshot — penalty
    return { scoreGained: 0, penalty: Math.round(angleDiff - 15) };
  }

  // Apply combo multiplier
  points = Math.round(points * combo.multiplier);

  // Update combo
  if (points >= COMBO_HIGH_THRESHOLD) {
    combo.consecutiveHighScore++;
    if (combo.consecutiveHighScore >= 5) combo.multiplier = 2.0;
    else if (combo.consecutiveHighScore >= 3) combo.multiplier = 1.5;
  } else {
    combo.consecutiveHighScore = 0;
    combo.multiplier = 1.0;
  }
  combo.lastScoreTime = Date.now();

  return { scoreGained: points, comboMultiplier: combo.multiplier };
}

/**
 * Hold still scoring with stamina/combo system
 */
function scoreHoldStill(player: Player, intensity: number, combo: ComboState): ScoreResult {
  if (intensity < 10) {
    // Perfect stillness — bonus for sustained stillness
    let bonusMultiplier = 1.0;
    if (intensity < 5) bonusMultiplier = 1.5; // Extra still

    let baseScore = Math.round(10 * bonusMultiplier * combo.multiplier);

    // Update combo
    if (baseScore >= COMBO_HIGH_THRESHOLD) {
      combo.consecutiveHighScore++;
      if (combo.consecutiveHighScore >= 5) combo.multiplier = 2.0;
      else if (combo.consecutiveHighScore >= 3) combo.multiplier = 1.5;
    } else {
      combo.consecutiveHighScore = 0;
      combo.multiplier = 1.0;
    }
    combo.lastScoreTime = Date.now();

    return { scoreGained: baseScore, comboMultiplier: combo.multiplier };
  } else if (intensity > 30) {
    // Too much movement — penalty
    return { scoreGained: 0, penalty: 15 };
  }
  return { scoreGained: 0 };
}

/**
 * Quick draw scoring with false start detection
 */
function scoreQuickDraw(
  room: Room,
  player: Player,
  isSpecialTrigger: boolean,
  combo: ComboState
): ScoreResult {
  if (room.signalActive && isSpecialTrigger && !player.quickDrawTime) {
    const reactionMs = Date.now() - (room.signalTime || Date.now());
    player.quickDrawTime = reactionMs;

    // Exponential scoring: faster = much more points
    let baseScore: number;
    if (reactionMs < 200) baseScore = 1000;           // Super fast
    else if (reactionMs < 300) baseScore = 800;        // Very fast
    else if (reactionMs < 400) baseScore = 600;        // Fast
    else if (reactionMs < 500) baseScore = 400;        // Good
    else if (reactionMs < 700) baseScore = 200;        // Average
    else baseScore = Math.max(100, 1000 - reactionMs); // Slow

    // Apply combo multiplier
    baseScore = Math.round(baseScore * combo.multiplier);

    // Update combo (quick draw combos are based on reaction speed)
    if (reactionMs < 400) {
      combo.consecutiveHighScore++;
      if (combo.consecutiveHighScore >= 5) combo.multiplier = 2.0;
      else if (combo.consecutiveHighScore >= 3) combo.multiplier = 1.5;
    } else {
      combo.consecutiveHighScore = 0;
      combo.multiplier = 1.0;
    }
    combo.lastScoreTime = Date.now();

    return { scoreGained: baseScore, comboMultiplier: combo.multiplier };
  }

  // False start detection — player triggered before signal
  if (isSpecialTrigger && !room.signalActive && !player.quickDrawTime) {
    return { scoreGained: 0, isFalseStart: true };
  }

  return { scoreGained: 0 };
}

/**
 * Main scoring dispatcher
 */
export function calculateScore(
  room: Room,
  player: Player,
  mechanicType: MechanicType,
  intensity: number,
  acc: { x: number; y: number; z: number },
  rot: { alpha: number; beta: number; gamma: number },
  isSpecialTrigger: boolean
): ScoreResult {
  const combo = getComboState(player.id);
  const now = Date.now();

  // Reset combo if too much time passed since last score
  if (now - combo.lastScoreTime > COMBO_RESET_TIME && combo.consecutiveHighScore > 0) {
    combo.consecutiveHighScore = 0;
    combo.multiplier = 1.0;
  }

  switch (mechanicType) {
    case 'shake':
      return scoreShake(player, intensity, combo);
    case 'whip':
      return scoreWhip(player, intensity, isSpecialTrigger, combo);
    case 'tilt':
      return scoreTilt(player, rot, combo);
    case 'hold_still':
      return scoreHoldStill(player, intensity, combo);
    case 'quick_draw':
      return scoreQuickDraw(room, player, isSpecialTrigger, combo);
    default:
      return { scoreGained: 0 };
  }
}

/**
 * Check for false start in quick_draw games
 */
export function checkFalseStart(room: Room, playerId: string): boolean {
  const player = room.players[playerId];
  return !!(player && !player.quickDrawTime && room.signalActive === false);
}
