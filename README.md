# 1-2-Switch 派对擂台

基于 React + Socket.io + 移动端传感器技术的派对游戏派对擂台平台。支持 30+ 款体感小游戏，实时多人对战。

## 功能特性

- **实时多人对战**：通过 Socket.io 实现低延迟多人同步
- **移动端体感控制器**：手机变身 Joy-Con，支持陀螺仪和加速度计
- **30+ 款小游戏**：包含摇动、倾斜、挥动、静立、快速拔枪等多种机制
- **智能评分系统**：连击倍数、精准度评分、防作弊检测
- **游戏管理器**：动态时间排程，自动切换游戏
- **老虎机动画**：游戏选择展示有趣的滚动动画效果
- **音效系统**：Web Audio API 合成音效，无需外部文件
- **错误边界**：React 错误捕获和恢复机制

## 游戏类型

1. **摇动类** (shake)：摇汽水、挤牛奶、疯狂摇摆马等
2. **倾斜类** (tilt)：神射手瞄准、密码锁开锁、冰上滑行等
3. **挥动类** (whip)：刀光剑影、篮球扣篮、魔法棒施法等
4. **静立类** (hold_still)：终极爆米花、心灵相通平衡等
5. **快速拔枪类** (quick_draw)：西部牛仔拔枪、抢答闪电铃等

## 技术栈

- **前端**：React 19 + TypeScript + Tailwind CSS v4
- **后端**：Node.js + Express + Socket.io
- **部署**：Vercel (前端) + Railway/Render (后端)
- **构建**：Vite + esbuild

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（后端+前端）
npm run dev
```

访问 http://localhost:3000

### 生产构建

```bash
npm run build
npm start
```

## 部署指南

### 方案一：Railway + Vercel（推荐）

1. **部署后端到 Railway**：
   - 在 Railway 创建项目，连接 GitHub 仓库
   - Railway 会自动检测 Node.js 并运行 `npm start`
   - 获取 Railway 提供的 URL（如 `https://your-app.up.railway.app`）

2. **部署前端到 Vercel**：
   - 在 Vercel Dashboard 导入项目
   - 添加环境变量 `VITE_SOCKET_URL` = Railway 的 URL
   - 部署即可

### 方案二：Railway 全包

Railway 同时支持静态文件和后端，可在一处部署全部服务。

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_SOCKET_URL` | Socket.io 后端地址 | 同域名 |

## 项目结构

```
├── server/               # 后端服务器
│   ├── server.ts        # 入口文件
│   ├── io.ts            # Socket.io 事件处理
│   ├── rooms.ts         # 房间管理
│   ├── gameplay.ts      # 游戏逻辑和评分
│   └── scheduler.ts     # 游戏阶段调度
├── src/                  # 前端源码
│   ├── components/      # React 组件
│   ├── hooks/           # 自定义 Hooks
│   ├── utils/           # 工具函数
│   ├── data/            # 游戏数据
│   └── types.ts         # TypeScript 类型
├── dist/                 # 生产构建输出
└── docs/                 # 文档
```

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT
