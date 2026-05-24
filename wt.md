# 提示词问题检查报告

## 🔴 严重错误（技术性）

### 1. Em7 和弦标注错误

**位置：** Chord Voicings 表格

```
Em7 | E2 (40) | G3-B3-D4-F#4 | 55-59-62-66
```

**问题：** 上方声部包含 F#4（第9音），这是 Em9 而不是 Em7。

* Em7 = E-G-B-D（根音、小三度、纯五度、小七度）
* Em9 = E-G-B-D-**F#**（加入大九度）

**修正：** 将标注改为 `Em9`，或去掉 F#4 还原为真正的 Em7 voicing（55-59-62）。

---

### 2. Voicing 规则与实际和弦自相矛盾

**位置：** Voicing Rules 第一条

> "Omit root note from upper structure (let bass handle root)"

但查看表格：

| 和弦    | 上方声部          | 问题             |
| ----- | ------------- | -------------- |
| D/F#  | A3-**D4**-F#4 | 根音 D 出现在上方声部 ❌ |
| Dsus4 | G3-A3-**D4**  | 根音 D 出现在上方声部 ❌ |

其余四个和弦遵守了此规则（Gmaj9、Em7、Cmaj9、Am9）。

**修正：** 规则需加注释："转位和弦（如 D/F#）及 sus 和弦允许根音出现在上方声部以保证和声完整性。"

---

### 3. 主旋律音域前后矛盾

**位置：** Melody Guidelines vs. 16-Bar MIDI Layout

* 前面声明：`Lead melody: Mid-range (B4-A5)`（B4 = MIDI 71）
* Bar 8 实际出现：`G4 Rest Rest Rest`（G4 = MIDI 67）

G4 低于声明的最低音 B4，直接违反了自己的规则。

---

### 4. "60 ticks" 缺乏定义，实际无效

**位置：** Kygo Chop Pattern

> "Duration: Each stab = \~60 ticks (very short)"

**问题：** Ticks 取决于 DAW 的 PPQ（每拍脉冲数）设置：

| PPQ                | 60 ticks 等于      |
| ------------------ | ---------------- |
| 96 PPQ（Ableton 默认） | ≈ 0.625 拍（无音乐意义） |
| 480 PPQ（标准 MIDI）   | 1/32 音符（极短）      |
| 960 PPQ            | 1/64 音符（几乎无声）    |

**修正：** 应改为具体音符时值，如 "1/16 note"。

---

## 🟠 结构性问题

### 5. 歌曲结构模板前后不一致

**位置：** Core Characteristics vs. Song Structure Template

开头定义的完整结构：

```
Intro → Verse → Pre-Chorus → Chorus → Drop → Breakdown → Build-up → Drop → Outro
```

但 16-bar 模板直接跳过了 Pre-Chorus 和 Chorus：

```
Bars 1-4:   Intro
Bars 5-8:   Verse
Bars 9-12:  Build-up   ← Pre-Chorus 和 Chorus 消失了
Bars 13-16: Drop
```

**修正：** 要么在 16-bar 模板中加入说明（"此为简化版，省略 Pre-Chorus/Chorus"），要么补全完整结构。

---

### 6. Build-up 小节细节程度严重不均

Bars 1-8 和 13-16 有逐拍的音符布局，而：

```
Bar 9-10: Off-beat 8ths, melody repeats at higher register
Bar 11-12: 16th note arpeggios ascending, velocity peaks
```

只有文字描述，没有具体 MIDI 音符，格式与其他小节不一致。

---

### 7. Build-up Pattern 符号数量错误

**位置：** Build-up Pattern Progression Stage 2

```
Stage 2 (2 bars): Off-beat 8ths (.X.X.X.X.)
```

`.X.X.X.X.` 共 **9 个符号**，但一个小节只有 8 个八分音符位置（8 个符号）。结尾多了一个 `.`。

**修正：** 改为 `.X.X.X.X`（8个）。

---

## 🟡 准确性存疑

### 8. "Firestone" 的和弦归属有误导性

> "vi-IV-I-V: Em7 - Cmaj9 - Gmaj9 - Dsus4→D (used in 'Firestone')"

**问题：** Kygo 的 "Firestone"（feat. Conrad Sewell）原曲实际为 **A小调 / C大调**（进行为 Am-F-C-G），而非 G 大调。此处是将同类型进行移调至 G 大调，但直接归属为 "Firestone" 会让读者按 G 调去验证时产生困惑。

**修正：** 加注说明："（同类进行，原曲为 A 小调 / C 大调）"。

---

### 9. "Stole the Show" 例子中的 Em 标注不一致

**位置：** Example 段落

```
Chords: Gmaj9 - D/F# - Em - Cadd9
```

其他地方统一使用 `Em7` 或 `Em9`，这里写成裸 `Em`，符号不统一。

---

### 10. BPM 范围可能偏窄

> "Tempo: 108-112 BPM (Kygo typically around 108)"

部分 Kygo 代表作实际 BPM：

* "Firestone" ≈ 100 BPM
* "Stole the Show" ≈ 124 BPM（也有争议）
* "It Ain't Me" ≈ 100 BPM

声明 108-112 过于集中，建议扩宽为 **100-115 BPM**，并注明不同段落（verse/drop）可有差异。

---

## 🟢 轻微问题

### 11. "Quick Tips" 与前文高度重复

10 条 Quick Tips 的内容几乎全部在前文 Production Techniques、Melody Guidelines 等章节中有详细说明，作为独立章节价值有限。可压缩为 3-5 条真正补充性提示。

---

### 12. Verse Pattern 过于稀疏（值得注意）

```
Pattern:  .    .    X    .    .    .    X    .
```

每小节只有 2 次和弦击打（第2拍和第3拍），对于 Verse 段落来说偏少，更像 Intro 的稀疏处理。如果是刻意设计，建议加文字说明。

---

## 📋 问题汇总

| 优先级   | 问题                        | 影响      |
| ----- | ------------------------- | ------- |
| 🔴 高  | Em7 应为 Em9                | 和弦理论错误  |
| 🔴 高  | Voicing 规则与 D/F#、Dsus4 矛盾 | 逻辑自洽性   |
| 🔴 高  | 旋律音域与 Bar 8 的 G4 矛盾       | 执行时产生混淆 |
| 🔴 高  | "60 ticks" 无 PPQ 参考       | 完全无法实操  |
| 🟠 中  | 歌曲结构与 16-bar 模板不一致        | 结构混乱    |
| 🟠 中  | Build-up 小节细节缺失           | 指引不完整   |
| 🟠 中  | Stage 2 符号多一个 `.`         | 格式错误    |
| 🟡 低  | Firestone 调性注明不清          | 可能误导验证  |
| 🟡 低  | BPM 范围偏窄                  | 参考价值有限  |
| 🟢 最低 | Quick Tips 重复             | 冗余      |
