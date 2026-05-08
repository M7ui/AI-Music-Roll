# Modern Music Composition & Arrangement Techniques

> **⚠️ This knowledge is embedded in your system prompt. You MUST apply these techniques when generating notes. Every melody you create should demonstrate at least 3 of the techniques below.**

---

## 1. Rests & Negative Space — 休止符与负空间

### The Golden Rule
**Silence is the most powerful note.** A melody without rests sounds suffocating, mechanical, and rushed — like someone talking without taking a breath.

### Rest Patterns by Style

| Style | Rest Frequency | Rest Duration | Effect |
|-------|---------------|---------------|--------|
| Ballad / Slow | Every 1-2 bars | 0.5–1.0 beat | Spacious, emotional |
| Pop / Rock | Every 2 bars | 0.25–0.5 beat | Natural, singable |
| Jazz / Swing | Every 2-4 bars | 0.25–0.75 beat | Sophisticated |
| EDM Build | Tiny gaps (0.25) | 0.25 beat between motifs | Energy building |
| Ambient / Lo-fi | Every 1-2 bars | 0.5–2.0 beats | Dreamy, floating |

### Concrete Examples

**BAD (all legato — no breathing):**
```
start: 0.0 dur:0.5 | 0.5 dur:0.5 | 1.0 dur:0.5 | 1.5 dur:0.5 |
2.0 dur:0.5 | 2.5 dur:0.5 | 3.0 dur:0.5 | 3.5 dur:1.0 |
```
→ Sounds like a robot reciting the alphabet. No musicality.

**GOOD (phrased with rests):**
```
start: 0.0  dur:0.5 | 0.5 dur:0.25 | 0.75 dur:1.0 | 
[1.75–2.25 REST 0.5 beat]
start: 2.25 dur:0.25 | 2.5 dur:0.75 | 3.25 dur:0.25 |
3.5 dur:0.5 | [4.0–4.5 REST 0.5 beat]
```
→ Natural phrasing. The ear has time to digest each musical "sentence."

### Staccato Simulation
Simulate staccato by using short duration + gap:
- Note duration: 0.25 beat
- Gap before next note: 0.25 beat
- Total slot: 0.5 beat (50% sound, 50% silence)
- velocity: 70-90 (shorter notes need slightly higher velocity to be heard)

---

## 2. Rhythmic Vocabulary — 节奏词汇表

### NEVER use only one note duration
A 4-bar phrase using only 0.5-beat notes (8 consecutive eighth notes) is the #1 sign of amateur composition.

### Essential Rhythm Patterns

```
Pattern Name      | Beat Pattern (each digit = duration in beats)
───────────────────────────────────────────────────────────────
Quarter pulse     | 1.0  1.0  1.0  1.0  (use sparingly, only for bass or pads)
Eighth flow       | 0.5  0.5  0.5  0.5  0.5  0.5  0.5  0.5  (NEVER alone)
Dotted swing      | 0.75 0.25 0.75 0.25 0.75 0.25 0.75 0.25  (jazz/swing feel)
Syncopated pop    | 0.5  1.0  0.25 0.25 1.0  0.5  0.25 0.25
Ballad breath     | 1.0  0.5  1.5  1.0  0.5  2.0  0.5  1.0
Classical phrase  | 0.5  0.5  1.0  0.25 0.25 1.0  0.5  0.5
EDM motif         | 0.25 0.25 0.5  ░░  0.25 0.25 0.5  ░░  1.0 ░░
Latin clave       | 1.0  0.5  1.0  1.0  0.5  1.5  (3-2 son clave)
```

### Syncopation Formula
Place accented notes ON the off-beat, not on the beat:
- Beat:     1    &    2    &    3    &    4    &
- Notes:    ░░   ●    ░░   ●    ░░   ●    ●    ░░
- Rhythm:   0.5  0.5  0.5  0.5  0.5  0.5  0.5  0.5  → BUT starting on off-beats

### Dotted Rhythm for Swing
Instead of two equal 0.25 notes, use:
- Long note: 0.5 beat (dotted 16th feel)
- Short note: 0.25 beat
- This creates triplet swing: ♪♪ → ♪.♪

---

## 3. Velocity as Expression — 力度即表情

### Velocity is NOT an afterthought
Every single note needs an intentional velocity. Flat velocity = flat emotion.

### Dynamic Shapes per Phrase

```
Crescendo (growing intensity):
vel: 60 → 70 → 80 → 90 → 100 → 105

Decrescendo (fading away):
vel: 100 → 90 → 80 → 70 → 60 → 50

Arch (climax in middle):
vel: 65 → 75 → 90 → 100 → 85 → 70 → 55

Wave (ebb and flow):
vel: 70 → 90 → 75 → 95 → 70 → 85 → 65
```

### Velocity by Note Function

| Note Role | Velocity Range | Description |
|-----------|---------------|-------------|
| Downbeat accent (beat 1) | 105–120 | Foundation pulse |
| Main melody note | 85–105 | The "singing" notes |
| Passing tone | 55–70 | Bridge between chord tones |
| Appoggiatura (leaning note) | 90→65 | Accent then step-resolve |
| Ghost note | 25–45 | Barely-there rhythmic filler |
| Echo/answer note | 50–65 | Softer response to a phrase |
| Climax note | 115–127 | The emotional peak |
| Resolution note | 70–85 | Gentle landing |

### Velocity Articulation Tricks

- **Sforzando (sfz)**: Single note at vel 127 surrounded by vel 60-70 notes
- **Portamento feel**: Two adjacent notes, first vel 85, second vel 75 — simulates slide
- **Tenuto**: Slightly higher velocity (100-110) on important held notes
- **Marcato**: vel 115+ on beat, vel 70 on off-beat neighbor

---

## 4. Phrase Architecture — 乐句建筑学

### The 4-Sentence Paragraph Model
Every 8-bar section should read like a paragraph:

```
Bar 1-2: "Once upon a time..."       [rising, 4-6 notes, end on 5th scale degree → REST]
Bar 3-4: "A melody was born..."      [higher, 6-8 notes, end on 2nd scale degree → REST]
Bar 5-6: "It danced through fields"  [varied rhythm, 5-7 notes, end on 3rd → REST]
Bar 7-8: "And found its way home."   [falling, 2-5 notes, end on tonic → LONG REST]
```

### Call & Response Pitch Patterns

```
Call (Question):                        Response (Answer):
C4→D4→E4→G4→A4→G4  [ends on G]   REST → E4→D4→C4→D4→E4→C4  [ends on C]
C4→E4→G4→C5→B4→G4  [ends on G]   REST → A4→G4→F4→E4→D4→C4  [ends on C]
```

### Contour Rules
- **Arch**: low→high→low (most natural, pleases the ear)
- **Descending**: high→low (emotional, melancholy)
- **Ascending**: low→high (building energy, tension)
- **Avoid**: completely flat melodies (stay on 2-3 notes) — boring

---

## 5. Density Orchestration — 密度编排

### The "Breathing Curve"
Density should flow like a wave, not a brick wall:

```
Section:  | Intro | Verse | Pre-C | Chorus | Bridge | Chorus | Outro |
Notes/bar:|  3-5  |  5-8  |  8-12 | 10-16  |  4-7   | 10-16  |  2-4  |
```

### Within an 8-Bar Section
```
Bar: 1    2    3    4    5    6    7    8
     ██   ██   ███  ████ ██   ███  █    ░
den: mid  mid  high  peak mid  high low  rest
```

### Density Techniques
- **Thinning**: Remove notes from inner voices, leave only melody + bass
- **Thickening**: Double melody at octave, add chord tones between melody notes
- **Staggered entry**: Notes enter one voice at a time, not all at beat 1
- **Drop-out**: Suddenly remove all notes for 1 beat for dramatic effect

---

## 6. Modern Melodic Patterns — 现代旋律模式

### Pop Melody Formulas (with Rests)

**2-Bar Motif Pattern (great for hooks):**
```
Bar 1: E4(0.5) F#4(0.25) G4(0.25) ░░(0.25) A4(0.25) G4(0.5) ░░(0.5)
Bar 2: E4(0.5) D4(0.25) C4(0.5)  ░░(0.25) D4(0.25) C4(1.0)
```
→ Short-short-long with breathing space. Memorable and singable.

**Pentatonic Run (EDM/Pop buildup):**
```
C5(0.25) D5(0.25) E5(0.25) G5(0.25) ░░(0.25) A5(0.25) G5(0.25) E5(0.5) ░░(0.5)
D5(0.25) C5(0.25) A4(0.25) G4(0.25) ░░(0.25) E4(0.5) C4(1.0) ░░(0.5)
```
→ Fast run → rest → resolution. The rest makes the fast part impactful.

**Arpeggio Melody (ballad):**
```
C4(0.5) E4(0.5) G4(0.5) ░░(0.25) C5(1.0) ░░(0.75)
B3(0.5)  D4(0.5) G4(0.5) ░░(0.25) B4(1.0) ░░(0.75)
A3(0.5)  C4(0.5) F4(0.5) ░░(0.25) A4(1.0) ░░(0.75)
G3(0.5)  C4(0.5) E4(0.5) ░░(0.25) C4(1.5)
```
→ Triad arpeggio + held note + generous rest. Emotional and spacious.

**Ghost Note Groove (funk/R&B):**
```
vel: 90 30 90 30 100 45 90 30
G4(0.25) ░░(0.25) A4(0.25) ░░(0.25) C5(0.25) D5(0.25) C5(0.5) A4(0.25)
```
→ Alternating loud/quiet + gaps. Groovy and alive.

### Hook Writing Principles
1. **Simplicity**: 3-5 unique pitches, not 12
2. **Repetition**: Repeat the motif at least once before varying
3. **Space**: The hook needs breathing room — don't crowd it
4. **Range**: Stay within 1 octave for singable hooks
5. **Rhythmic identity**: A distinctive rhythm is more memorable than pitch

---

## 7. Chord Progression Selection — 和声进行选择

### Scale Degrees → MIDI Quick Reference

| Key | I | ii | iii | IV | V | vi | vii° |
|-----|---|----|-----|----|---|----|------|
| C Major | C4(60) | D4(62) | E4(64) | F4(65) | G4(67) | A4(69) | B4(71) |
| G Major | G4(67) | A4(69) | B4(71) | C5(72) | D5(74) | E5(76) | F#5(78) |
| D Major | D4(62) | E4(64) | F#4(66) | G4(67) | A4(69) | B4(71) | C#5(73) |
| F Major | F4(65) | G4(67) | A4(69) | Bb4(70) | C5(72) | D5(74) | E5(76) |
| A Minor | A4(69) | B4(71) | C5(72) | D5(74) | E5(76) | F5(77) | G#5(80) |
| E Minor | E4(64) | F#4(66) | G4(67) | A4(69) | B4(71) | C5(72) | D#5(75) |
| D Minor | D4(62) | E4(64) | F4(65) | G4(67) | A4(69) | Bb4(70) | C#5(73) |

### Progression by Emotion

| Emotion | Progression | Key Example (C) |
|---------|-------------|-----------------|
| Hopeful/Uplifting | I–V–vi–IV | C–G–Am–F |
| Nostalgic/Bittersweet | vi–IV–I–V | Am–F–C–G |
| Dramatic/Epic | vi–V–IV–V | Am–G–F–G |
| Sad/Emotional | i–VI–III–VII | Am–F–C–G |
| Jazzy/Sophisticated | ii–V–I–VI | Dm–G–C–Am |
| Dreamy/Ambient | I–iii–IV–V | C–Em–F–G |
| Funky/Groovy | i–IV–i–V | Am–D–Am–E |
| Classical/Cadence | I–IV–V–I | C–F–G–C |
| Blues | I7–IV7–I7–V7–IV7–I7 | C7–F7–C7–G7–F7–C7 |
| Tension/Resolution | V7–I (repeated) | G7–C |

### Chord Voicing Guidelines (for single-instrument piano roll)
- **Root position**: Root in bass (lowest note), play chord tones above
- **Close voicing**: All notes within 1 octave — warm, intimate
- **Open voicing**: Spread across 2 octaves — grand, spacious
- **Drop voicing**: Drop the 2nd voice down an octave — rich jazz sound
- **Spread triads**: Root in bass, 5th in middle, 3rd on top — modern pop sound

---

## 8. Layering & Texture — 层次与织体

### 3-Layer Model (for single-instrument composition)

```
Layer 1 — MELODY (top, pitch 60-79):      The lead voice. Expressive. Rests between phrases.
Layer 2 — HARMONY (middle, pitch 48-67):   Chord tones. Slower rhythm. Supports the melody.
Layer 3 — BASS (bottom, pitch 36-55):      Root notes. Simplest rhythm. Foundation.
```

### Texture Density Guide

| Texture | Description | When to Use |
|---------|-------------|-------------|
| **Monophonic** | Single melody line, no chords | Intro, verse 1 |
| **Homophonic** | Melody + chord accompaniment | Chorus, main sections |
| **Polyphonic** | Multiple independent melodies | Bridge, development |
| **Sparse** | Bass + occasional melody notes | Breakdown, verse |
| **Dense** | Melody + chords + bass + fills | Climax, final chorus |

### Build-up Formula (EDM/Pop)
```
Bar 1-2: Only bass and kick-simulated note (monophonic)
Bar 3-4: Add harmony layer (2 voices)
Bar 5-6: Add melody fragments (3 voices)
Bar 7-8: Full texture (drop) — all layers active
```

### Breakdown Formula
```
Bar 1-2: Remove bass, keep melody sparse (2-3 notes per bar)
Bar 3-4: Remove melody, keep only pad-like sustained chord tones
Bar 5-6: Reintroduce bass + melody fragments
Bar 7-8: Full return
```

---

## 9. Scale & Interval Tropes — 音阶与音程套路

### Emotional Interval Map
| Interval | Semitones | Emotion |
|----------|-----------|---------|
| Minor 2nd | 1 | Tension, unease, mystery |
| Major 2nd | 2 | Stepwise movement, neutral |
| Minor 3rd | 3 | Sadness, melancholy |
| Major 3rd | 4 | Brightness, happiness |
| Perfect 4th | 5 | Open, heroic, spacious |
| Tritone | 6 | Danger, conflict, blues |
| Perfect 5th | 7 | Power, stability, hollow |
| Minor 6th | 8 | Longing, yearning |
| Major 6th | 9 | Warmth, nostalgia |
| Minor 7th | 10 | Soulful, bluesy |
| Major 7th | 11 | Dreamy, floating |
| Octave | 12 | Completeness, finality |

### Scale Tropes by Mood

**Happy/Bright:**
- C Major pentatonic: C D E G A (60,62,64,67,69)
- Pattern: stepwise ascending with skip to 5th

**Sad/Melancholic:**
- A Natural Minor: A B C D E F G (69,71,72,74,76,77,79)
- Pattern: descending from 5th to tonic, with minor 3rd emphasis

**Mysterious/Ambient:**
- A Dorian: A B C D E F# G (69,71,72,74,76,78,79)
- Pattern: alternating between major 6th and minor 3rd

**Epic/Cinematic:**
- C Lydian: C D E F# G A B (60,62,64,66,67,69,71)
- Pattern: ascending perfect 5ths, wide intervals

**Bluesy/Soulful:**
- C Blues: C Eb F Gb G Bb (60,63,65,66,67,70)
- Pattern: sliding between minor 3rd and major 3rd

**Exotic/Eastern:**
- C Phrygian: C Db Eb F G Ab Bb (60,61,63,65,67,68,70)
- Pattern: use the flat 2nd (Db) as a leading tone to tonic

---

## 10. Section Development Map — 段落发展蓝图

### Standard Pop Structure (32 bars)
```
Section  | Bars    | Notes/Bars | Texture   | Velocity  | Key Action
─────────┼─────────┼────────────┼───────────┼───────────┼───────────
Intro    | 1-4     | 2-4        | Sparse    | 60-75     | Establish key
Verse 1  | 5-12    | 4-6        | Thin      | 70-85     | I-V-vi-IV
Pre-C    | 13-16   | 6-10       | Building  | 80-95     | Rising to V
Chorus   | 17-24   | 8-14       | Full      | 90-110    | I-V-vi-IV (strong)
Verse 2  | 25-32   | 5-7        | Med-full  | 75-90     | Same as V1 + variation
Pre-C    | 33-36   | 7-12       | Building  | 85-100    | Rising to V
Chorus   | 37-44   | 10-16      | Full+     | 95-115    | Double chorus energy
Bridge   | 45-52   | 4-7        | Sparse    | 65-80     | vi-IV-I-V
Chorus   | 53-60   | 10-16      | Max       | 100-120   | Final impact
Outro    | 61-64   | 2-4        | Fading    | 50-65     | Resolve to I
```

### 8-Bar Mini Structure (for quick generation)
```
Bar 1-2: Establish motif (4-6 notes, moderate density)
Bar 3-4: Repeat + vary motif (5-7 notes, slight crescendo)
Bar 5-6: Contrast phrase (different rhythm or register, 3-5 notes, rest)
Bar 7-8: Resolution (2-4 notes concluding on tonic, decrescendo)
```

---

## 11. Common Mistakes to AVOID — 常见错误

| ❌ Mistake | ✅ Fix |
|-----------|-------|
| All notes same duration | Mix 3+ durations per section |
| No gaps between notes | Insert 0.25-1.0 beat rests after every phrase |
| All notes same velocity | Vary velocity 50-120 based on note function |
| Same note density every bar | Create density wave: low→high→low |
| Melody starts on beat 1 every bar | Start some phrases on beat 2, 2.5, or 3 |
| Notes only on strong beats (1,2,3,4) | Place notes on off-beats (1.5, 2.5, 3.5) |
| Monotonous pitch range (within 5 notes) | Use 1-1.5 octave range with strategic leaps |
| No clear phrase endings | Every phrase ends with a held note or rest |
| Bass and melody in same register | Separate by at least 1 octave |
| Chord tones only | Mix 30% non-chord tones as passing/decoration |

---

## 12. Quick Generation Checklist — 快速自检清单

Before calling add_notes, verify:
```
□ At least 3 different note durations in this section
□ At least 1 rest gap (≥0.25 beat) every 2-3 bars
□ Velocity varies by at least 30 points across notes
□ Phrase ends on a held note (duration ≥0.5) OR a rest
□ Density changes between bars (not uniform)
□ Melody covers at least 1 octave range
□ Strongest beat (beat 1) has chord tone, not passing tone
□ At least 1 syncopated (off-beat) note
```
