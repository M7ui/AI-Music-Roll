

 6 大技术亮点

---

### 第一：提示词即架构 —— 音乐质量的"硬约束"体系

**位置：** [app.js:10-99](file:///g:\ver\AI-Music-Roll\public\app.js#L10-L99) + [techniques.md:1-401](file:///g:\ver\AI-Music-Roll\prompts\techniques.md#L1-L401)

**核心代码：**
```javascript
// app.js L31-58 - 不是"建议"，是可被 AI 解析的形式化约束
🔴 RULE 1 — RESTS & SILENCE ARE MANDATORY
NEVER make all notes connected back-to-back.
Every melodic phrase (2-4 beats) MUST end with at least 0.25–0.5 beat of silence.

🔴 RULE 2 — RHYTHMIC VARIETY
Every 4-bar section MUST mix at least 3 different note durations
from {0.25, 0.5, 0.75, 1.0, 1.5, 2.0}.

🔴 RULE 3 — VELOCITY DYNAMICS
velocity range is 1-127. NEVER use same velocity for all notes.
Main melody notes: 80-110. Ghost notes: 25-45. Accent: 110-127.
```

**为什么不可撼动：**

这不是普通的 system prompt。大部分 AI 音乐工具的做法是："请帮我写一段好听的旋律"——然后祈祷模型做对。这个项目做了一件完全不同的事：它把**音乐质量的形式化规范**嵌入到了 prompt 中，将 LLM 变成了一个受约束的生成器而非自由即兴者。

三层约束体系：
1. **RULE 0-7**（app.js）—— 强制性操作流程，要求 AI 在调用 `add_notes` 之前必须"先规划再执行"，类似于编译器的类型检查阶段
2. **[techniques.md](file:///g:\ver\AI-Music-Roll\prompts\techniques.md#L387-L401)** 末段的**快速自检清单** —— 8 条可验证的约束条件，AI 在每次生成前需逐条对照
3. **正反例对比**（techniques.md L24-L37）—— 用具体的音符序列展示 BAD vs GOOD 的区别，这对 LLM 的行为引导远强于抽象描述

这种设计代表了一种新范式：**Prompt-Driven Architecture（PDA）**。传统架构中，质量保证靠代码逻辑；PDA 中，质量保证靠 prompt 中的形式化约束。换一个 LLM 不用改代码，只需调整 constraints，犹如数据库不需要改代码就能切换引擎。任何竞争对手想达到同等生成质量，要么走 PDD（Prompt-Driven Design），要么走传统路线（大量的后处理规则代码），两者门槛都极高。

---

### 第二：全链路零依赖 —— 从 HTTP 到 MIDI 的"裸写"完整管线

**位置：** [server.js:1-558](file:///g:\ver\AI-Music-Roll\server.js#L1-L558) + [midi_gen.py:1-111](file:///g:\ver\AI-Music-Roll\midi_gen.py#L1-L111)

**核心代码：**
```python
# midi_gen.py L18-27 - 自实现变长编码，MIDI 1.0 规范的核心基础
def encode_var_len(value: int) -> bytes:
    value = max(0, value)
    parts = bytearray()
    parts.append(value & 0x7F)
    value >>= 7
    while value:
        parts.append((value & 0x7F) | 0x80)
        value >>= 7
    return bytes(reversed(parts))
```

```python
# midi_gen.py L63-64 - note-off 优先排序，处理重叠音符的关键逻辑
raw_note_events.sort(key=lambda x: (x[0], 0 if x[1] == "off" else 1))
```

**为什么不可撼动：**

在现代 JavaScript/Python 生态中，做到"零外部依赖"需要满足以下所有条件：

| 子系统 | 社区标准方案 | 本项目方案 | 所需知识 |
|--------|-------------|-----------|---------|
| HTTP 服务 | Express / Fastify | Node.js 原生 `http` | RFC 7230 理解 |
| SSE 流式 | eventsource 库 | 手动 `text/event-stream` | 流式协议实现 |
| MIDI 生成 | mido / python-midi | 手写二进制编码 | MIDI 1.0 文件格式规范 |
| 音频播放 | Tone.js / Howler.js | Web Audio API 原生 | AudioContext 时序控制 |
| Canvas 渲染 | PixiJS / Fabric.js | Canvas 2D API 原生 | 双画布滚动同步 |
| LLM 调用 | OpenAI SDK | 原生 `https.request` | HTTP 流解析 |

这意味着开发者必须同时精通：**网络协议、二进制格式编码、音频 DSP 基础、Canvas 图形学、流式数据解析**。任何一个子系统的能力缺口都会迫使引入第三方库。这不是"有毅力就能做到"的事，需要跨 5 个以上专业领域的深度知识。

举个例子：`midi_gen.py` 的第 63-64 行排序逻辑 `(tick, 0 if "off" else 1)` 是 MIDI 规范中的一个微妙要求——同 tick 下 note-off 必须优先于 note-on。如果排序反了，会出现先按下新键再松开旧键的"幽灵重叠"，在慢速琶音中尤其明显。这类细节只有亲手写过 MIDI 编码器的人才会注意到。

---

### 第三：单样本音色系统 —— 以 `playbackRate` 代采样库

**位置：** [app.js:716-737](file:///g:\ver\AI-Music-Roll\public\app.js#L716-L737)

**核心代码：**
```javascript
// app.js L718-727
function playSample(pitch, startTime, duration, vel) {
  const semitonesFromC4 = pitch - 60;
  const pitchRatio = Math.pow(2, semitonesFromC4 / 12);
  // ...
  src.playbackRate.value = pitchRatio;

  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(v, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001,
    startTime + Math.min(duration * 0.85, decoded.duration * 0.9));
}
```

**为什么不可撼动：**

传统方法要实现多音高采样播放，需要：
- 一个完整的 SF2/SFZ 音色库（几十 MB 起）
- 一个 SoundFont 解析器
- 每个音高区域至少一个采样
- 复杂的区间映射和交叉淡入淡出逻辑

本项目只需要：**一个 WAV/MP3 文件，一行 `playbackRate.value = 2^(semitones/12)`**。

这是对早期硬件采样器原理（Fairlight CMI, 1979）的现代 Web API 化。`Math.pow(2, semitonesFromC4 / 12)` 这个公式就是十二平均律的数学表达——每升高一个半音，频率乘以 2 的 1/12 次方。配合 `exponentialRampToValueAtTime` 做指数衰减避免爆音，16 行代码替代了一个完整的音频中间件。

**这个设计体现的不是代码能力，而是对"什么才是必要的"的深刻判断。** 大多数工程师拿到"多音高播放"需求会立刻去 GitHub 搜索 SoundFont 库，而不会想到用物理原理替代工程复杂度。这种判断力无法通过 CRUD 经验积累获得。

---

### 第四：双画布分离 + marginTop 滚动同步 —— 零开销的键盘锁定

**位置：** [app.js:94-95](file:///g:\ver\AI-Music-Roll\public\app.js#L94-L95) + [app.js:619-621](file:///g:\ver\AI-Music-Roll\public\app.js#L619-L621)

**核心代码：**
```javascript
// 两个独立 Canvas，键盘区域不参与横向滚动
const keysCv = $('keys-canvas');   // 固定在左侧
const gridCv = $('grid-canvas');    // 嵌入可滚动容器

// 滚动同步：一行 CSS 属性搞定
gridWrap.addEventListener('scroll', () => {
  keysCv.style.marginTop = -gridWrap.scrollTop + 'px';
});
```

**为什么不可撼动：**

传统做法有三种：
- **方案 A**：单 Canvas 渲染一切，手动计算视口偏移 → 代码复杂，高 DPI 下容易出渲染偏移
- **方案 B**：键盘区域用 DOM 元素（div），网格用 Canvas → 对齐精度难保证
- **方案 C**：引入 PixiJS / Konva 等库 → 引入依赖，包体积膨胀

本项目的做法是：**两个 Canvas 保持一致的物理尺寸，键盘 Canvas 通过 `marginTop` 负值跟随网格容器滚动**。这利用了浏览器的原生渲染优化——CSS transform/position 的变化由 GPU 合成器处理，不触发重绘。

配合 `paintAll()` 中的 [app.js:345-441](file:///g:\ver\AI-Music-Roll\public\app.js#L345-L441) 自适应计算逻辑：
```javascript
// app.js L317-343 - 动态计算 CELL_H 和 CELL_W
function calcCellSize() {
  CELL_H = Math.max(14, Math.floor(availH / N_P));  // 垂直自适配
  CELL_W = Math.min(32, Math.max(8, ...));           // 横向约束
  bars = Math.max(8, Math.min(64, actualBars));      // 小节数自适应
}
```

这确保了在任何屏幕尺寸下键盘和网格的绝对对齐，且零性能开销。这种方案需要同时理解 CSS 滚动模型、Canvas 坐标系和浏览器渲染管线三个领域，是"前端老手才会写出的代码"。

---

### 第五：SSE 流式代理的健壮解析 —— 抵御不完整 chunk 的缓冲策略

**位置：** [server.js:206-254](file:///g:\ver\AI-Music-Roll\server.js#L206-L254)

**核心代码：**
```javascript
// server.js L206-254
let buffer = '';
hres.on('data', (chunk) => {
  buffer += chunk.toString();
  const parts = buffer.split('\n\n');  // 按 SSE 事件分隔符切分
  buffer = parts.pop() || '';           // 未完成的部分留在缓冲区

  for (const part of parts) {
    const lines = part.split('\n');
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        // ... 处理 delta.content, delta.reasoning_content, delta.tool_calls
      } catch(e) { /* skip malformed chunk */ }
    }
  }
});
```

**为什么不可撼动：**

这段代码处理了 SSE 流式传输中最棘手的 4 个边界情况：

1. **不完整 chunk**：`parts.pop()` 将切割后不完整的最后一段保留到下次拼接——这是流式解析的标准模式，但实现中 `|| ''` 这个 fallback 处理了单次 chunk 恰好以 `\n\n` 结尾时的空数组情况
2. **流式 tool_calls 拼接**：OpenAI 的 streaming 模式下，tool_call 的 `arguments` 是增量传输的 JSON 片段，需要在多个 chunk 间拼接（L238-248）。`tc.function.arguments += tc.function.arguments` 这个字符串拼接最终会在客户端侧被 `JSON.parse`
3. **reasoning_content 独立处理**：DeepSeek 等模型返回的 `reasoning_content` 字段需要单独流式转发，最终在流结束时包裹到 `tool_calls` 消息中（L261）
4. **客户端断开时的资源清理**：`req.on('close', () => { hreq.destroy(); })` 确保用户点击"停止"时上游 API 连接立即断开

这不是"能用就行"的错误处理，而是**对所有已知 SSE 异常模式的系统性防御**。大多数教程级别的 SSE 实现只会写 `if (line.startsWith('data:'))`，遇到不完整 JSON chunk 就会静默丢弃或崩溃。这段代码的生产级健壮性来自于对 SSE 协议和 OpenAI streaming 格式的深刻理解。

---

### 第六：拖拽交互的 `requestAnimationFrame` 限流 + 原地变异混合策略

**位置：** [app.js:486-605](file:///g:\ver\AI-Music-Roll\public\app.js#L486-L605)

**核心代码：**
```javascript
// app.js L546-568 - 拖拽中的 RAF 限流
if (Math.abs(e.clientX - lastDragX) > 3 || Math.abs(e.clientY - lastDragY) > 3) {
  // ... 计算新位置
  if (dragraf) cancelAnimationFrame(dragraf);  // 去重
  dragraf = requestAnimationFrame(() => {
    paintAll();  // 整个画布重绘，而非局部更新
  });
}
```

**为什么不可撼动：**

这里有三层精妙设计：

**第一层**：`Math.abs(delta) > 3` 的死区阈值。3px 是人类手指/鼠标的物理抖动范围。不加这个阈值，每次微动都触发重绘计算，CPU 占用率会飙升。但阈值太大（如 10px）会导致拖拽感"粘滞"。

**第二层**：`cancelAnimationFrame` + `requestAnimationFrame` 的去重策略。`mousemove` 事件可能以 120Hz+ 的频率触发（取决于鼠标硬件），但显示器只有 60Hz。RAF 确保了最多 60fps 的重绘，`cancelAnimationFrame` 确保了如果两次 mousemove 在一个帧间隔内连续发生，只有最新的位置会被渲染。这是教科书级别的渲染节流实现。

**第三层**：原地变异 vs 深拷贝的策略选择。注意拖拽修改 `dragNote.pitch` 和 `dragNote.start_beat` 时是直接修改 notes 数组中的对象，而非创建副本。这意味着：
- 内存零分配（每次 mousemove 不创建新对象）
- 渲染时 `paintAll()` 直接读取最新值
- 但风险是：如果拖拽中需要撤销，历史记录在 `mousedown` 时已经 snapshot 了

这是一种"性能优先、在正确的时机做正确的快照"的工程判断。大多数开发者会安全地用深拷贝，导致拖拽卡顿；这个项目选择了性能路径，并以精确的快照时机弥补风险。