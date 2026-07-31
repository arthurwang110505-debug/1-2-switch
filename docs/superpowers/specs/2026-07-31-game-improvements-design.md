# 1-2-Switch 派對擂台 - 遊戲改進設計

**Date:** 2026-07-31
**Status:** Draft — Awaiting Review

---

## 1. 專案概述

當前是一個基於 Socket.io + React 的即時多人派對遊戲平台，手機瀏覽器透過陀螺儀/加速度計作為 Joy-Con 控制器，在大螢幕上進行 1-2-Switch 風格體感競速遊戲。

**現有架構：**
- Frontend: React 19 + TypeScript + Tailwind v4 + Vite
- Backend: Express + Socket.io + Bun/Node
- Mechanics: `shake`, `tilt`, `whip`, `hold_still`, `quick_draw` (5 種)
- Games: 20 款小遊戲
- Modes: 單一競賽模式

**目標：** 透過 4 個階段性改進，升級為完整派對遊戲平台。

---

## 2. 改進策略

**Approach: Incremental Layering (分層增量改進)**

| Phase | 內容 | 影響範圍 |
|-------|------|----------|
| Phase 1 | 架構重構 + 基礎建設 | 整體 |
| Phase 2 | 計分系統重設計 | 遊戲邏輯 |
| Phase 3 | 新增小遊戲 (10 款) | 遊戲資料庫 |
| Phase 4 | 新增遊戲模式 + 視覺打磨 | 整體體驗 |

---

## 3. Phase 1: 架構重構

### 3.1 Server 模組拆分

```
server/
  ├── io.ts        — Socket.io 連接、房間生命週期
  ├── rooms.ts     — 房間狀態管理
  ├── gameplay.ts  — 計分邏輯 (per-mechanic)
  ├── scheduler.ts — 遊戲流程控制
  └── server.ts    — 入口點
```

### 3.2 Frontend 元件拆分

```
src/components/
  ├── HostLobby.tsx
  ├── HostPractice.tsx
  ├── HostCountdown.tsx
  ├── HostPlaying.tsx
  ├── HostResult.tsx
  └── HostLeaderboard.tsx
```

### 3.3 動態感應增強

- `calibrate()` 方法記錄基準靜止強度
- 根據 `mechanicType` 自動調整閾值
- 新增 sensitivity 設定 (低/中/高)

### 3.4 錯誤處理與韌性

- React Error Boundary
- 斷線標記 `isEliminated`
- 心跳檢測
- 完善重連狀態恢復

---

## 4. Phase 2: 計分系統重設計

### 4.1 各機制計分改進

| 機制 | 當前 | 改進後 |
|------|------|--------|
| `shake` | `intensity * 0.3` | 穩定度乘數 (節奏獎勵) |
| `whip` | `intensity * 1.5` | 力量分級 (輕/中/重) |
| `tilt` | 15° 內 8pt | 精確度分層 (0°=20, 5°=15, 10°=10, 15°=8) |
| `hold_still` | <10: +10, >30: -15 | 耐力系統 + combo 乘數 |
| `quick_draw` | `max(100, 1000-ms)` | 誤判懲罰 + 指數加分 |

### 4.2 新功能

**Combo 系統**
- 連續 3 次高分 → 1.5x
- 連續 5 次高分 → 2.0x
- 中斷 → 重置

**完美回合 Bonus**
- 達到理論最大值 → ×1.5

### 4.3 反作弊

- 速率限制 (~30fps)
- 物理極限檢查
- 連線測試綁定

---

## 5. Phase 3: 新增 10 款小遊戲

| # | 名稱 | 機制 | 特色 |
|---|------|------|------|
| 1 | 時鐘倒數 | `hold_still` + timing | 保持水平讓計時器倒數 |
| 2 | 節奏大師 | `shake` + timing | 配合音樂節奏搖晃 |
| 3 | 極限平衡 | `tilt` | 維持球在平台中央 |
| 4 | 潛水艇躲避 | `tilt` + `hold_still` | 交替躲藏與移動 |
| 5 | 魔法藥水 | `shake` + `tilt` | 先搖後傾倒 |
| 6 | 冰上滑行 | `tilt` | 慣性物理滑向目標 |
| 7 | 鐘擺衝擊 | `whip` + timing | 單擺時機打擊 |
| 8 | 神經質反應 | `quick_draw` + `hold_still` | 靜止與反應雙重挑戰 |
| 9 | 熱氣球競速 | `shake` + `whip` | 雙輸入協調 |
| 10 | 最後一站 | `hold_still` elimination | 最後不動者獲勝 |

---

## 6. Phase 4: 遊戲模式 + 視覺打磨

### 6.1 新增遊戲模式

1. **雙人協力** — 2 人共用手機，協力得分
2. **速戰模式** — 15 秒快速遊戲
3. **團隊對抗** — 分組競爭
4. **淘汰賽** — 每回合最低分淘汰
5. **挑戰模式** — 預選遊戲 + 難度選擇

### 6.2 視覺改進

- CSS transition 過場動畫
- 計分浮動數字
- per-mechanic 視覺回饋
- 淘汰動畫

### 6.3 音效擴展

- BGM 循環
- Combo 觸發音效
- 淘汰懲罰音效
- 完美回合歡呼

---

## 7. 成功標準

| 維度 | 目標 |
|------|------|
| 遊戲數量 | 20 → 30 款 |
| 遊戲模式 | 1 → 6 種 |
| 架構模組化 | 3 個檔案 → 10+ 模組 |
| 計分系統 | 5 種 → 5 種進階 |
| 音效系統 | 5 種 → 15+ 種+BGM |

---

*Draft — awaiting review*
