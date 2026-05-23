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

### Essential Note Values
```
Whole note:     4.0 beats
Half note:      2.0 beats
Quarter note:   1.0 beat
Eighth note:    0.5 beat
Sixteenth:      0.25 beat
Dotted quarter: 1.5 beats
Dotted eighth:  0.75 beat
Double whole:   8.0 beats
```

### Custom Duration Rules
- Duration values can be **any multiple of 0.25** (e.g., 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, ...)
- **Maximum duration:** 8.0 beats
- **Minimum duration:** 0.25 beats
- Valid examples: 7.25, 7.5, 6.75, 5.25, etc.
- Invalid examples: 0.20, 0.15, 8.5, 0.1 (not multiples of 0.25)

### Rhythmic Patterns by Genre

**Pop/Rock:**
- `1.0 1.0 0.5 0.5` (steady driving)
- `0.5 0.5 0.5 0.5 1.0 1.0` (syncopated)
- `0.25 0.25 0.5 0.25 0.25 1.0` (pop-punk)

**Jazz Swing:**
- Use dotted rhythms (0.75 + 0.25) for swing feel
- `0.75 0.25 0.75 0.25` (swung eighths)
- `1.5 0.5 1.0 1.0` (with anticipation)

**EDM:**
- `0.25 0.25 0.25 0.25` (four-on-the-floor)
- `0.5 0.25 0.25 0.5 0.5` (off-beat accents)

---

## 3. Velocity Dynamics — 力度动态

### Velocity Ranges
- **Pianissimo (pp):** 20-40
- **Piano (p):** 40-60
- **Mezzo (mp-mf):** 60-90
- **Forte (f):** 90-110
- **Fortissimo (ff):** 110-127

### Dynamic Shapes
- **Crescendo:** Gradually increase velocity over 2-4 notes
- **Decrescendo:** Gradually decrease velocity
- **Accent:** One note with significantly higher velocity (e.g., +20)
- **Pianissimo entrance:** Start soft, build gradually

---

## 4. Chord Progressions — 和弦进行

### Pop Progressions
- **I-V-vi-IV:** C-G-Am-F (most popular)
- **I-vi-IV-V:** C-Am-F-G
- **vi-IV-I-V:** Am-F-C-G

### Jazz Standards
- **ii-V-I:** Dm7-G7-Cmaj7
- **I-viio-ii-V:** C-Bdim-Dm7-G7

---

## 5. Scale Types — 音阶类型

| Scale | Notes | Mood |
|-------|-------|------|
| Major | 1-2-3-4-5-6-7 | Bright, happy |
| Minor | 1-2-b3-4-5-b6-b7 | Sad, melancholic |
| Pentatonic Major | 1-2-3-5-6 | Folk, pop |
| Pentatonic Minor | 1-b3-4-5-b7 | Blues, rock |
| Blues | 1-b3-4-b5-5-b7 | Soulful |

---

## 6. Melodic Contour — 旋律轮廓

### Shape Patterns
- **Ascending:** Notes moving upward (builds tension)
- **Descending:** Notes moving downward (resolves tension)
- **Arch:** Up then down (question-answer)
- **Wave:** Gentle undulation (conversational)

### Avoid
- **Parallel motion:** All voices moving in same direction
- **Large leaps without resolution:** Jumping an octave without stepwise return

---

## 7. Call & Response — 呼应结构

### Phrase Structure
- **Question (A):** 2 bars, ends on non-tonic (2, 4, or 5)
- **Answer (B):** 2 bars, resolves to tonic (1 or 3)
- **Development (C):** Variation of A
- **Conclusion (D):** Final resolution

### Example (4/4)
```
Phrase A (0-2): Question ending on 5
REST: 0.5 beat
Phrase B (2.5-4.5): Answer resolving to 1
REST: 0.5 beat
Phrase C (5-7): Variation
REST: 0.5 beat
Phrase D (7.5-9): Conclusion
```

---

## 8. EDM Production Techniques

### Drop Structure
1. **Build-up:** Gradually add layers, filter sweep
2. **Drop:** Full sound, heavy bass
3. **Breakdown:** Sparse, prepare for next drop

### Sidechain Compression
- Duck bass when kick hits
- Creates pumping effect
- Use 0.25 beat intervals

---

## 9. Classical Counterpoint

### Rules
1. **No parallel 5ths/octaves**
2. **Contrary motion preferred**
3. **Stepwise motion (conjunct)** over leaps (disjunct)
4. **Voice leading:** Smooth transitions between chords

### Voice Ranges
- Soprano: 60-80
- Alto: 50-70
- Tenor: 40-60
- Bass: 36-50

---

## 10. Lyrical Writing Tips

### Syllable Mapping
- Short notes = staccato syllables (quick, light)
- Long notes = held vowels (sustained)

### Rhythm Matching
- Natural speech rhythm should match musical rhythm
- Avoid forcing words into awkward note values

---

## Final Checklist

Before generating any melody, verify:
1. ✅ At least 3 different note durations
2. ✅ Rests every 2-4 bars
3. ✅ Velocity variation (not all same)
4. ✅ Clear phrase structure
5. ✅ Key-appropriate notes
6. ✅ Resolution to tonic
7. ✅ Breathing space (negative space)

---

## 11. Complete Composition Templates — 完整编曲模板

These are WORKING BLUEPRINTS. Use them as the starting point for any composition request. Do NOT improvise from scratch — adapt one of these templates based on the user's requested style and key.

### Template A: Pop Ballad (C Major, 80 BPM, Verse→Chorus→Verse→Chorus)

**Structure:**
```
Section 1: intro (4 bars)     → sparse piano, C-E-G arpeggio
Section 2: verse (8 bars)     → storytelling, mid-range, rests
Section 3: chorus (8 bars)    → hook, higher, more energy
Section 4: outro (4 bars)     → fade on C
```

**Chord Progression:** C maj (0-4) → G maj (4-8) → Am min (8-12) → F maj (12-16)

**Verse Melody Template (C4-E4 range, vel 65-85):**
```
Motif: E4(0.0,0.75) G4(1.0,0.5) [REST 0.25] C5(1.75,1.0)
Repeat transposed: G4(4.0,0.75) C5(5.0,0.5) [REST 0.25] D5(5.75,1.0)
Variation: D5(8.0,0.5) C5(8.75,0.25) A4(9.0,1.5) [REST 0.25]
Resolution: G4(12.0,1.0) E4(13.5,0.5) [REST 0.5] C4(14.5,2.0)
Key principle: 4-bar phrases, each ending with a rest. Conversational feel.
```

**Chorus Melody Template (C5-E5 range, vel 85-110):**
```
Hook: C5(0.0,0.5) C5(0.75,0.25) E5(1.0,0.75) D5(2.0,0.5) C5(2.75,0.5) A4(3.5,1.0)
Repeat: C5(4.0,0.5) C5(4.75,0.25) E5(5.0,0.75) D5(6.0,0.5) C5(6.75,0.5) G4(7.5,2.0)
Key principle: Chorus MUST be higher AND louder than verse. Simple, memorable hook.
```

### Template B: EDM Drop (A Minor, 128 BPM)

**Structure:**
```
Section 1: build_up (4 bars)   → rising 16th notes, vel 70→110
Section 2: drop (8 bars)       → full energy, layered
Section 3: breakdown (4 bars)  → stripped, build anticipation
Section 4: drop (8 bars)       → repeat with variation
```

**Build-up Template:**
```
Phase 1 (0-1):  A3, 2 notes/beat, vel 70-74
Phase 2 (1-2):  C4, 4 notes/beat, vel 76-82
Phase 3 (2-3):  E4, 4 notes/beat, vel 84-92
Phase 4 (3-4):  G4→A4→C5 ascent, 4 notes/beat, vel 96→110
```

**Drop Lead Melody (A4-C5 range, vel 95-115):**
```
Hook phrase: A4(0.0,0.25) C5(0.5,0.25) A4(1.0,0.25) E5(1.5,0.5)
[REST 0.5]
Syncopated: G4(2.5,0.25) A4(3.0,0.5) C5(3.75,0.25) D5(4.0,0.5)
[REST 0.25]
Repeat: A4(4.5,0.25) C5(5.0,0.25) A4(5.5,0.25) E5(6.0,0.5)
[REST 0.5]
Climax: G4(7.0,0.25) A4(7.5,1.0) [REST 0.5] C5(8.0,2.0)
Key principle: Short, punchy notes. Off-beat starts. Syncopation everywhere.
```

### Template C: Jazz Ballad (F Minor, 65 BPM, ii-V-I progression)

**Chord Progression:**
```
Gm7(b5) (0-4) → C7(b9) (4-8) → Fm7 (8-12) → Fm7 (12-16)
```

**Melody Template (F4-Ab5 range, vel 55-85):**
```
Phrase 1: F4(0.0,1.5) [REST 0.5] G4(2.0,0.5) Ab4(2.75,0.25) C5(3.0,1.5)
[REST 0.5]
Phrase 2: Bb4(5.0,1.0) [REST 0.5] C5(6.5,0.75) Db5(7.5,0.25) C5(8.0,2.0)
[REST 0.5]
Phrase 3: Ab4(10.5,1.0) [REST 0.5] G4(12.0,0.5) F4(12.75,0.5) Eb4(13.5,1.0)
[REST 0.5]
Phrase 4: F4(15.0,2.0) [REST 1.0]
Key principle: Swung rhythms (0.75+0.25 pairs), chromatic passing tones between chord tones, expressive rubato via velocity waves.
```

### Template D: Multi-Track Arrangement (C Major, 120 BPM)

This template shows how to compose for multiple tracks simultaneously.

**Track 0: Melody (C4-E5, vel 85-100)**
```
Motif-based 8-bar chorus, syncopated starts, chord tones on strong beats.
```

**Track 1: Bass (C2-C3, vel 90)**
```
Root notes of each chord on beats 1 and 3, vel 90 steady.
C2(0.0,1.0) C2(2.0,1.0) G2(4.0,1.0) G2(6.0,1.0)
A2(8.0,1.0) A2(10.0,1.0) F2(12.0,1.0) F2(14.0,1.0)
```

**Track 2: Chords (C3-G4, vel 70-80)**
```
Sustained chord pads: C maj triad(0.0,4.0) G maj triad(4.0,4.0)
Am min triad(8.0,4.0) F maj triad(12.0,4.0)
```

**Track 3: Counter-melody (G3-C5, vel 60-75)**
```
Complementary line, fills gaps where melody rests. Softer than melody.
```

### How to Use These Templates

1. When a user says "写一段流行歌曲" → adapt Template A
2. When "来一段电子音乐" → adapt Template B
3. When "爵士风格的曲子" → adapt Template C
4. When "完整的编曲" → adapt Template D

Always:
- Start with set_section() for each section
- Define set_chords() for the progression
- Adapt pitches to the user's requested key
- Maintain the characteristic rhythm, velocity range, and register of each section type
- After generating, call analyze_melody() to check quality and iterate
