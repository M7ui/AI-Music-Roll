# AI Piano Roll 🎹

> 基于 AI 的钢琴卷帘旋律生成器 — 用自然语言创作音乐，所见即所得。

AI Piano Roll 是一个极简但功能完备的 AI 音乐工作站。通过 OpenAI 兼容 API，你可以用自然语言描述心中的旋律、和弦进行和编曲想法，AI 会直接在钢琴卷帘网格上生成可编辑的 MIDI 音符。支持流式对话、自定义音色、MIDI 导出，全部在浏览器中完成，无需安装任何插件。

---

## ✨ 功能特点

### 🎵 核心创作

- **AI 智能作曲** — 用自然语言描述音乐，AI 通过 Function Calling 自动调用工具生成音符
- **流式对话输出** — AI 回复逐字呈现，配合思考过程（reasoning）展示，实时感知 AI 的创作思路
- **可视化钢琴卷帘** — Canvas 渲染的标准钢琴卷帘界面，支持缩放、滚动，所见即所得
- **实时音频预览** — 基于 Web Audio API 的三角波合成器，点击播放即时试听
- **标准 MIDI 导出** — 自实现 Type-0 MIDI 编码器，支持任意音符重叠的正确时间排序

### 🎛️ 编辑功能

- **点击添加音符** — 左键点击网格任意位置添加音符，右键删除
- **拖动调整位置** — 按住音符拖动可同时调整起始位置和音高
- **拖动调整时值** — 拖拽音符右边缘（粉色高亮）可拉伸或缩短音符长度
- **撤销支持** — `Ctrl+Z` 撤销上一步操作，最多保留 50 步历史
- **力度控制** — 工具栏力度滑块调节音符力度（Velocity 1–127）
- **主音量控制** — 独立的全局音量滑块，控制整体输出电平

### 🤖 AI 交互

- **思考指示器** — 发送消息后即时显示「AI 思考中 ● ● ●」脉冲动画
- **思考过程可见** — 支持 reasoning/thinking 模式，AI 的思考过程以折叠面板展示
- **停止生成** — 随时中断 AI 对话，不会卡住界面
- **新对话** — 一键清空对话历史，开启全新作曲会话
- **多轮工具调用** — AI 可持续多轮调用工具（添加音符→设置调式→调整速度），最大 20 轮安全限制

### 🎼 音乐理论

- **AI 知识库注入** — `prompts/techniques.md` 包含音阶、和弦、EDM/House/Pop 编曲等专业知识
- **实时调式显示** — 工具栏展示当前调式和拍号，AI 调用 `set_key` 后即时更新
- **智能节奏量化** — 所有音符自动吸附 0.25 拍网格（16 分音符精度）

### 🔊 音色系统

- **合成器模式** — 默认三角波合成器，零配置即可播放
- **自定义音色** — 将 WAV/MP3/OGG/M4A/AAC/FLAC 文件放入 `vocal/` 目录自动加载
- **预解码缓存** — 音色文件启动时预解码为 AudioBuffer，播放零延迟

---

## 🚀 快速开始

### 1. 安装依赖

项目零外部依赖，仅需 Node.js（≥18）：

```bash
npm install
```

> 实际上 `npm install` 不会安装任何第三方包，`package.json` 仅声明 ES Module 类型。项目使用 Node.js 内置的 `http`、`https`、`fs`、`path` 模块。

### 2. 启动服务

```bash
node server.js
```

访问 **http://127.0.0.1:8765**

### 3. 配置 AI API

首次运行时，点击右上角 **⚙ 配置** 按钮，或手动创建 `.ai_piano_roll_cfg.json`：

```json
{
  "provider": "cloud",
  "base_url": "https://api.openai.com/v1",
  "api_key": "sk-your-api-key-here",
  "model": "gpt-4o"
}
```

配置会自动保存，下次启动无需重新设置。

---

## 🔌 支持的模型类型

### 云端 API（OpenAI / 兼容服务）

| 配置项 | 值 |
|--------|-----|
| `provider` | `cloud` |
| `base_url` | `https://api.openai.com/v1` 或兼容服务地址 |
| `api_key` | `sk-...`（必填） |
| `model` | `gpt-4o` / `gpt-4-turbo` / `gpt-3.5-turbo` 等 |

> 兼容任何 OpenAI Chat Completions API 格式的服务（如 Azure OpenAI、DeepSeek、通义千问等），只需修改 `base_url` 和 `model`。

### 本地模型（Ollama / LM Studio）

本地模型不需要 API Key，完全离线运行。

**Ollama：**

```json
{
  "provider": "local",
  "base_url": "http://127.0.0.1:11434/v1",
  "api_key": "",
  "model": "llama3.2"
}
```

常用模型：`llama3.2` / `phi3` / `mistral` / `qwen2.5` / `codellama`

**LM Studio：**

```json
{
  "provider": "local",
  "base_url": "http://127.0.0.1:1234/v1",
  "api_key": "",
  "model": "你的模型名称"
}
```

> 💡 LM Studio 需在设置中启用「API Server」选项（默认端口 1234）。

### 配置字段一览

| 字段 | 说明 |
|------|------|
| `provider` | `cloud` = 云端 API（需要 API Key），`local` = 本地模型 |
| `base_url` | API 端点地址 |
| `api_key` | 云端 API 密钥（`local` 模式可留空） |
| `model` | 模型名称，如 `gpt-4o`、`llama3.2` |

### 测试连接

配置面板内置「测试连接」按钮，点击即可验证 API 可用性和延迟。

---

## 📖 使用指南

### 钢琴卷帘基本操作

| 操作 | 方式 |
|------|------|
| 添加音符 | 左键点击空白网格 |
| 移动音符 | 拖动已有音符 |
| 调整时值 | 拖拽音符右边缘（光标变为 ↔） |
| 删除音符 | 右键点击音符 |
| 预览播放 | 点击 **▶ 播放** 按钮 |
| 停止播放 | 点击 **■ 停止** 按钮 |
| 导出 MIDI | 点击 **⬇ MIDI** 按钮 |
| 清空全部 | 点击 **✕ 清除** 按钮 |

### 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Z` | 撤销上一步操作 |
| `Delete` | 删除所有音符（需确认） |

### AI 作曲助手

在右侧聊天面板输入自然语言描述：

```
写一段 C 大调的流行旋律，用 I-V-vi-IV 进行
给我一段欢快的电子音乐，120 BPM
用 Am-F-C-G 和弦进行创作一段 lo-fi
来一段 12 小节布鲁斯
添加一些切分音节奏和幽灵音
```

AI 会通过以下工具函数操作钢琴卷帘：

| 工具 | 功能 | 参数 |
|------|------|------|
| `add_note` | 添加单个音符 | pitch, start_beat, duration, velocity? |
| `add_notes` | 批量添加音符 | notes[] |
| `remove_note` | 删除指定音符 | pitch, start_beat |
| `clear_all` | 清空所有音符 | — |
| `get_notes` | 获取当前音符列表 | — |
| `set_tempo` | 设置速度 | bpm (40–300) |
| `set_key` | 设置调式 | root_note, scale_type |
| `set_time_signature` | 设置拍号 | numerator, denominator |

### AI 思考过程

当使用支持 reasoning/thinking 的模型时，AI 的思考过程会以灰色流式文字显示，完成后自动收折为 **💭 思考过程** 面板，点击可展开查看。

### 音色自定义

将音频文件放入项目根目录的 `vocal/` 文件夹，支持以下格式：

| 格式 | 扩展名 |
|------|--------|
| WAV | `.wav` |
| MP3 | `.mp3` |
| OGG | `.ogg` |
| M4A | `.m4a` |
| AAC | `.aac` |
| FLAC | `.flac` |

启动服务后系统自动加载音色，工具栏右侧会显示当前音色名称。

### 音乐知识库定制

`prompts/techniques.md` 作为 AI 的 System Prompt 补充，包含：

- **音阶** — 17 种音阶及音程定义
- **和弦** — 20 种和弦类型（Major、Minor、Dim、Aug、7th、9th、Sus 等）
- **和弦进行** — 流行、爵士、布鲁斯、EDM、House 等常见套路
- **EDM 技巧** — Drop 结构、Bass drop、Sidechain 律动、Build-up
- **切分技巧** — Ghost notes、Hemiola、Anticipations 等特殊节奏
- **旋律公式** — Catchy melody、Call & Response、Hook 技巧
- **钢琴编曲** — 左手低音模式、右手 Voicing、分解和弦型

编辑该文件即可定制 AI 的音乐创作风格和知识范围。

---

## 📁 项目结构

```
AI-Music-Roll/
├── prompts/
│   └── techniques.md              # AI 音乐理论知识库
├── public/
│   └── index.html                 # 前端界面（Canvas + Web Audio）
├── vocal/
│   └── (自定义音色文件)             # 音色目录（支持 6 种音频格式）
├── server.js                      # 后端服务（Node.js 原生 http 模块）
├── package.json                   # 项目配置（零依赖）
├── .gitignore                     # Git 忽略规则
├── .ai_piano_roll_cfg.json        # API 配置文件（不入库）
├── LICENSE                        # MIT 许可证
└── README.md
```

---

## 🛠️ 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **后端** | Node.js 原生 `http` / `https` 模块 | 零框架依赖，极简路由 |
| **前端** | 原生 HTML5 + CSS + JavaScript | Canvas 双画布架构，无前端框架 |
| **音频** | Web Audio API | 合成器 + 采样播放双模式 |
| **AI 协议** | OpenAI Chat Completions API | Function Calling + SSE Streaming |
| **MIDI** | 自实现 Type-0 MIDI 编码 | 标准 MIDI 1.0 规范，running status 压缩 |
| **通信** | Server-Sent Events (SSE) | 流式文本输出 + 思考过程转发 |

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

Copyright (c) 2026 AI Piano Roll
