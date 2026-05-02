# AI Piano Roll - AI 钢琴卷帘生成器

一款基于 AI 的钢琴卷帘旋律生成器，通过 OpenAI 兼容 API 智能创作音乐旋律、和弦进行和编曲。

## 功能特点

- 🎹 **AI 智能作曲** - 通过自然语言描述生成钢琴卷帘旋律
- 🎼 **多种音乐工具** - 音阶、和弦进行、琶音等
- 📊 **可视化编辑** - 实时预览和编辑 MIDI 音符
- 🎵 **多格式音频** - 支持 WAV/MP3/OGG/M4A/AAC/FLAC 自定义音色
- 🎹 **MIDI 导出** - 生成标准 MIDI 文件下载
- 🔊 **Web Audio 播放** - 无需安装插件即可播放

## 快速开始

### 1. 安装依赖

```bash
cd node_version
npm install
```

### 2. 配置 AI API

首次运行后，配置文件 `node_version\.ai_piano_roll_cfg.json` 会自动创建。

请编辑配置文件，填入您的 API 信息：

```json
{
  "provider": "cloud",
  "base_url": "https://api.openai.com/v1",
  "api_key": "your-api-key-here",
  "model": "gpt-4o"
}
```

## 支持的模型类型

### 云端 API（OpenAI / 兼容 API）

| 配置项 | 值示例 |
|--------|--------|
| provider | `cloud` |
| base_url | `https://api.openai.com/v1` |
| api_key | `sk-...`（必填） |
| model | `gpt-4o`、`gpt-3.5-turbo` 等 |

### 本地模型（Ollama / LM Studio）

本地模型不需要 API Key，直接在本地运行。

**Ollama 配置示例：**

```json
{
  "provider": "local",
  "base_url": "http://127.0.0.1:11434/v1",
  "api_key": "",
  "model": "llama3.2"
}
```

常用 Ollama 模型：`llama3.2`、`phi3`、`mistral`、`qwen2.5`、`codellama`

**LM Studio 配置示例：**

```json
{
  "provider": "local",
  "base_url": "http://127.0.0.1:1234/v1",
  "api_key": "",
  "model": "你的模型名称"
}
```

> **提示**：LM Studio 需要在设置中启用 "API" 选项（默认端口 1234）

### 配置字段说明

| 字段 | 说明 |
|------|------|
| provider | `cloud`=云端 API，`local`=本地模型 |
| base_url | API 地址（云端或本地） |
| api_key | 云端 API 密钥（本地模型可留空） |
| model | 模型名称 |

### 3. 启动服务

```bash
node server.js
```

### 4. 打开浏览器

访问 http://127.0.0.1:8765

## 使用方法

### 基本操作

1. **添加音符** - 点击钢琴卷帘网格添加音符
2. **拖动音符** - 拖动已添加的音符调整位置
3. **删除音符** - 右键点击音符删除
4. **播放预览** - 点击 ▶ 按钮播放当前旋律

### AI 对话指令

用自然语言描述您想要的音乐，AI 会自动生成音符：

```
生成一个 C 大调的流行旋律
给我一段欢快的电子音乐
用 Am-F-C-G 和弦进行创作
添加一些切分音节奏
```

### 工具函数

AI 可以使用以下工具：

| 工具 | 说明 |
|------|------|
| `add_note` | 添加单个音符 |
| `add_notes` | 批量添加音符 |
| `remove_note` | 删除音符 |
| `clear_all` | 清空所有音符 |
| `get_notes` | 获取当前音符列表 |
| `set_tempo` | 设置 BPM (40-300) |
| `set_key` | 设置调式 |
| `set_time_signature` | 设置拍号 |

### 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `空格` | 播放/暂停 |
| `Delete` | 删除选中的音符 |
| `Ctrl+S` | 保存/导出 MIDI |

## 目录结构

```
node_version/
├── prompts/
│   └── techniques.md    # AI 音乐技巧知识库
├── public/
│   └── index.html       # 前端界面
├── vocal/
│   └── (自定义音色文件)  # 自定义音色目录
├── server.js            # 后端服务
├── package.json         # 项目配置
└── .ai_piano_roll_cfg.json  # API 配置（需手动填写）
```

## 自定义音色

将音频文件放入 `vocal/` 目录，支持以下格式：

- WAV
- MP3
- OGG
- M4A
- AAC
- FLAC

系统会自动加载目录中的第一个音频文件作为默认音色。

## 音乐技巧配置

`prompts/techniques.md` 包含 AI 使用的音乐理论知识，包括：

- 音阶和音程
- 和弦及和弦进行
- EDM/House/Pop 编曲技巧
- 切分音等特殊节奏型
- 旋律写作公式

如需自定义 AI 的音乐知识，编辑该文件即可。

## 技术栈

- **后端**: Node.js + Express
- **前端**: 原生 HTML5 Canvas + Web Audio API
- **通信**: OpenAI 兼容 API (Function Calling)
- **MIDI**: 标准 Type-0 MIDI 文件生成

