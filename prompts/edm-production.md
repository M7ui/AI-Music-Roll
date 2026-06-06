# EDM Production Techniques (128 BPM)

## Drum Programming

### Kick Pattern
Standard four-on-the-floor (every quarter note):
```
Beat:  1    2    3    4
Kick:  X    X    X    X
```

**Variations:**
- **Double kick**: Add off-beat kick on "and" of 2 and 4
- **Syncopated**: Move kick on beat 3 to "and" of 2
- **Breakbeat**: Remove kick on beat 3, add on "and" of 3

### Clap/Snare Pattern
Standard backbeat (beats 2 and 4):
```
Beat:   1    &    2    &    3    &    4    &
Clap:   .    .    X    .    .    .    X    .
```

**Variations:**
- **Double clap**: Add clap on "and" of 2 and 4
- **Off-beat clap**: Move clap to "and" of 2 and 4
- **Trap clap**: Add multiple claps in 16th notes

### Hi-Hat Pattern
Standard eighth notes:
```
Beat:   1    &    2    &    3    &    4    &
HiHat:  X    .    X    .    X    .    X    .
```

**Variations:**
- **16th notes**: Fill every 16th note position
- **Syncopated**: Remove hi-hats on beats 2 and 4
- **Open hi-hat**: Replace closed hi-hat on "and" of 2

## Build-up Techniques

### Snare Roll
Linear acceleration:
```
Phase 1 (0-2 bars):  Snare every beat (4 per bar)
Phase 2 (2-4 bars):  Snare every half beat (8 per bar)
Phase 3 (4-6 bars):  Snare every quarter beat (16 per bar)
Phase 4 (6-8 bars):  Snare every eighth beat (32 per bar)
```

### Pitch Rise
Ascending pitch with velocity crescendo:
```
Notes: A3(start:0, dur:0.25, vel:70) → A3(start:0.5, dur:0.25, vel:72) → ... → C5(start:7.5, dur:0.25, vel:110)
```

### Filter Sweep
High-pass filter opening:
```
Start: Low-pass at 200Hz (muffled)
End: Low-pass at 20kHz (bright)
```

## Drop Techniques

### Impact Elements
- **Kick**: Strong on beat 1, velocity 100-120
- **Clap**: On beats 2 and 4, velocity 90-110
- **Bass**: Root note, sustained, velocity 95-115
- **Lead**: Main melody, high register, velocity 85-105

### Rhythm Patterns
**Standard drop rhythm:**
```
Beat:   1    &    2    &    3    &    4    &
Lead:   X    .    X    .    X    .    X    .
Bass:   X    .    .    .    X    .    .    .
```

**Syncopated drop:**
```
Beat:   1    &    2    &    3    &    4    &
Lead:   .    X    .    X    .    X    .    X
Bass:   X    .    .    .    X    .    .    .
```

## Bass Design

### Sub Bass
Low frequency (30-80 Hz), sine wave, minimal harmonics:
```
Notes: A1(57) or G1(55), duration 0.5-1.0, velocity 100-120
```

### Bass Pattern
Root on beat 1, fifth on beat 3:
```
Beat:   1    &    2    &    3    &    4    &
Bass:   A1   .    .    .    E2   .    .    .
```

### Wobble Bass
Modulated pitch or filter:
```
Notes: A1(57) with pitch bend or filter automation
```

## Arrangement Structure

### Standard EDM Structure
1. Intro (8 bars): Sparse, filtered
2. Build-up (8 bars): Rising energy
3. Drop (16 bars): Maximum energy
4. Breakdown (8 bars): Stripped back
5. Build-up (8 bars): Rising energy
6. Drop (16 bars): Maximum energy
7. Outro (8 bars): Fading

### Energy Curve
```
Intro: 30% → Build-up: 30% → 90% → Drop: 100% → Breakdown: 40% → Build-up: 40% → 100% → Drop: 100% → Outro: 30%
```

## Sound Design Tips

### Layering
- **Kick**: Layer sub (50-100 Hz) + click (2-5 kHz)
- **Clap**: Layer noise + tonal snap
- **Lead**: Layer saw + square + noise

### Processing
- **Compression**: Fast attack, medium release on drums
- **EQ**: Cut mud (200-400 Hz), boost presence (2-5 kHz)
- **Reverb**: Short decay on drums, long on pads
- **Delay**: Sync to tempo (1/4 or 1/8 note)

## MIDI Note Reference

### Common EDM Pitches
- **Sub bass**: A1(57), G1(55), C2(36)
- **Bass**: A2(45), G2(43), C3(48)
- **Lead**: A4(69), G4(67), C5(72)
- **Chords**: Am(57,60,64), C(60,64,67), F(65,69,72)

### Velocity Guide
- **Kick**: 100-120
- **Clap**: 90-110
- **Hi-hat**: 60-80 (closed), 80-100 (open)
- **Lead**: 80-100
- **Bass**: 90-110
