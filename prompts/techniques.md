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
