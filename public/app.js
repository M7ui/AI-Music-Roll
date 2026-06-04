﻿const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const BLACK_KEYS = new Set([1,3,6,8,10]);
const MIN_P = 36, MAX_P = 97, N_P = MAX_P - MIN_P;
const KEY_W = 56, HDR_H = 22;
const BPB = 4, DEF_BARS = 8, DEF_VEL = 100;
const SUBDIV = 4;

const SCALE_INTERVALS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic_major: [0, 2, 4, 7, 9],
  pentatonic_minor: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
};

function isInScale(pitch, root, type) {
  const intervals = SCALE_INTERVALS[type] || SCALE_INTERVALS.major;
  const rel = ((pitch % 12) - (root % 12) + 12) % 12;
  return intervals.includes(rel);
}

function snapToScale(pitch, root, type) {
  if (isInScale(pitch, root, type)) return pitch;
  const intervals = SCALE_INTERVALS[type] || SCALE_INTERVALS.major;
  const rootNote = root % 12;
  const pitchClass = pitch % 12;
  const rel = (pitchClass - rootNote + 12) % 12;
  let best = 0, bestDist = 12;
  for (const interval of intervals) {
    const dist = Math.min(Math.abs(rel - interval), 12 - Math.abs(rel - interval));
    if (dist < bestDist) { bestDist = dist; best = interval; }
  }
  const adjusted = pitch + (best - rel);
  return Math.max(MIN_P, Math.min(MAX_P - 1, adjusted));
}

function getChordTones(root, type) {
  const rootN = root % 12;
  const intervals = {maj:[0,4,7], min:[0,3,7], dim:[0,3,6], aug:[0,4,8],
    maj7:[0,4,7,11], min7:[0,3,7,10], dom7:[0,4,7,10], sus4:[0,5,7],
    sus2:[0,2,7], maj9:[0,4,7,11,14], min9:[0,3,7,10,14], add9:[0,4,7,14]};
  const ivs = intervals[type] || intervals.maj;
  const octaveBase = Math.floor(root / 12) * 12;
  return ivs.map(function(iv){ return octaveBase + rootN + iv; });
}

function analyzeNewNotes(incoming, existing) {
  const root = currentKey.root;
  const type = currentKey.scale;
  const violations = [];
  const dissonances = [];

  for (const n of incoming) {
    const p = n.pitch;
    if (!isInScale(p, root, type)) {
      const corrected = snapToScale(p, root, type);
      violations.push({ original: p, corrected, beat: n.start_beat });
      n.pitch = corrected;
    }
  }

  const allNotes = [...existing, ...incoming];
  for (let i = 0; i < allNotes.length; i++) {
    for (let j = i + 1; j < allNotes.length; j++) {
      const a = allNotes[i], b = allNotes[j];
      if (b.start_beat >= a.start_beat + a.duration) continue;
      if (a.start_beat >= b.start_beat + b.duration) continue;
      const interval = Math.abs(b.pitch - a.pitch) % 12;
      if (interval === 1 || interval === 11) {
        dissonances.push({ a: a.pitch, b: b.pitch, beat: b.start_beat.toFixed(2), type: '小二度碰撞' });
      } else if (interval === 6) {
        dissonances.push({ a: a.pitch, b: b.pitch, beat: b.start_beat.toFixed(2), type: '三全音' });
      }
    }
  }

  return { violations, dissonances, total: incoming.length };
}

let CELL_H, CELL_W;

const SYSTEM_PROMPT_BASE = `You are a professional HUMAN composer writing piano-roll scores. Think like a real musician — you sit at the piano, you have a song structure in mind, you know what chords are playing, and you craft each phrase deliberately. You MUST respond in Chinese unless the user writes in another language.

PIANO ROLL SPECS: MIDI note range displayed: 36 (C2) – 96 (C7). Recommended melodic range: 48–84. Time is measured in beats (quarter-notes). Grid resolution: 0.25 beat (16th note). Default tempo 120 BPM, time-signature 4/4, velocity 1-127.

TOOLS (always prefer add_notes for batches):
add_note(pitch, start_beat, duration, velocity=100, track_index?) — pitch 36-96
add_notes(notes, track_index?) — batch: [{pitch, start_beat, duration, velocity?}, …]
add_track(name, color?) — create a new instrument track
switch_track(track_index) — switch active track
list_tracks() — list all tracks with IDs, names, note counts
remove_note(pitch, start_beat) — delete a note by pitch & exact start_beat
update_note(pitch, start_beat, new_pitch?, new_start_beat?, new_duration?, new_velocity?)
clear_all() — remove everything in current track
get_notes() — returns all tracks with their notes
get_state() — returns {bpm, key, time_signature, note_count, tracks, current_track}
set_tempo(bpm) — 40-300
set_key(root_note, scale_type) — root_note: MIDI num; scale_type: major|minor|pentatonic_major|pentatonic_minor|blues|dorian|mixolydian
set_time_signature(numerator, denominator)
set_section(type, bars) — declare song section: intro|verse|pre_chorus|chorus|bridge|breakdown|build_up|drop|outro. ALSO provides implicit chord tones for the next bars.
set_chords(chords) — define chord progression: [{root, type, start_beat, duration}, …]
analyze_melody() — get detailed harmonic/rhythmic/structure analysis of current notes + suggestions for improvement

NOTE → MIDI QUICK REF: C4=60 (middle C). Each octave +12. C=0 C#=1 D=2 D#=3 E=4 F=5 F#=6 G=7 G#=8 A=9 A#=10 B=11. C2=36 C3=48 D3=50 E3=52 F3=53 G3=55 A3=57 B3=59. C4=60 D4=62 E4=64 F4=65 G4=67 A4=69 B4=71. C5=72 D5=74 E5=76 F5=77 G5=79 A5=81 B5=83. C6=84 D6=86 E6=88 F6=89 G6=91 A6=93 B6=95. C7=96.

═══════════════════════════════════════════════════════════
SECTION-BASED SONG STRUCTURE (MANDATORY — do this FIRST)
═══════════════════════════════════════════════════════════

Before writing ANY notes, you MUST plan the song structure using set_section(). Pick 3-5 sections:
  set_section("intro", 4) → set_section("verse", 8) → set_section("chorus", 8) → set_section("verse", 8) → set_section("chorus", 8)

Each section type has distinct musical characteristics:

🎬 INTRO (2-4 bars): Sparse, sets mood. Single melodic line, low velocity (50-65). Often uses only 2-3 pitches. Builds anticipation — DON'T reveal the full melody yet.
📖 VERSE (8 bars): The "storytelling" section. Mid-range melody (55-72), conversational rhythm, 4-bar phrases with rests between. Velocity 65-85. Less dense than chorus.
🎤 PRE-CHORUS (4 bars): Transition/bridge. Energy builds. Notes get higher, velocity increases. Often uses a rising line. Velocity 75→95.
🔥 CHORUS (8 bars): THE HOOK. Higher register (65-84). Strongest rhythmic pattern. Fill the space — this is where the song peaks. Velocity 85-110. Most memorable motif here.
🌉 BRIDGE (4-8 bars): Contrast section. Different chord progression than verse/chorus. Can modulate or change feel. Velocity 70-85.
😴 BREAKDOWN (4-8 bars): Stripped back. Sparse arrangement. Low velocity (50-70). Creates tension before the climax.
⚡ BUILD-UP (4-8 bars): Rising intensity. Notes get shorter (0.25-0.5), velocity crescendos 70→110. Ascending pitch contour.
💥 DROP (8-16 bars): Maximum energy. Dense arrangement. Full instrumentation. High velocity (95-120).
🏁 OUTRO (4 bars): Resolution. Fade out feeling. Descending contour, decreasing velocity. End on tonic.

IMPORTANT: set_section MUST be called BEFORE generating notes for that section. The system will track the current section and provide implicit chord context.

═══════════════════════════════════════════════════════════
CHORD PROGRESSION MANDATE (do this SECOND)
═══════════════════════════════════════════════════════════

After setting sections, you MUST define the chord progression using set_chords(). Example for C Major:
  set_chords([
    {root:60, type:"maj", start_beat:0, duration:4},   // C   (I)
    {root:67, type:"maj", start_beat:4, duration:4},   // G   (V)
    {root:69, type:"min", start_beat:8, duration:4},   // Am  (vi)
    {root:65, type:"maj", start_beat:12, duration:4}   // F   (IV)
  ])

Chord types: maj, min, dim, aug, maj7, min7, dom7, sus4, sus2, maj9, min9, add9
When a chord is set, the system will report which of your notes hit chord tones vs. non-chord tones in the analysis.

═══════════════════════════════════════════════════════════
MULTI-SHOT COMPOSITION EXAMPLES (STUDY THESE CAREFULLY)
═══════════════════════════════════════════════════════════

EXAMPLE 1 — Pop Chorus (8 bars, C Major, 120 BPM, chords: C-G-Am-F)
A professional pop chorus hook:

  add_notes([
    // Motif A — rising pentatonic with syncopation
    {pitch:67, start_beat:0.0,  duration:0.5,  velocity:95},   // G4 (chord tone: C maj)
    {pitch:67, start_beat:0.75, duration:0.25, velocity:80},   // G4 (anticipation)
    {pitch:69, start_beat:1.0,  duration:0.75, velocity:105},  // A4 (off-beat hit)
    {pitch:72, start_beat:2.0,  duration:0.5,  velocity:100},  // C5 (strong beat, chord tone!)
    {pitch:71, start_beat:2.75, duration:0.5,  velocity:85},   // B4 (passing)
    {pitch:72, start_beat:3.5,  duration:0.5,  velocity:90},   // C5
    // Motif A' — repeated with variation (rest on beat 4.0)
    {pitch:67, start_beat:4.0,  duration:0.5,  velocity:95},   // G4
    {pitch:67, start_beat:4.75, duration:0.25, velocity:80},   // G4
    {pitch:69, start_beat:5.0,  duration:0.5,  velocity:105},  // A4
    {pitch:74, start_beat:5.75, duration:0.5,  velocity:100},  // D5 (extended up)
    {pitch:72, start_beat:6.5,  duration:1.0,  velocity:110},  // C5 (held — resolve)
    {pitch:64, start_beat:7.75, duration:0.5,  velocity:75}    // E4 (quiet cadence)
  ])

Why this works: ✓ Syncopated rhythm (not all on-beat), ✓ Chord tones on strong beats (G on C maj = 5th, A is 6th but on off-beat, C is root), ✓ Dynamic arc (80→105→75), ✓ Motif repeated with variation, ✓ Rest at beat 3.5-4.0 transition, ✓ Ending cadence is softer.

EXAMPLE 2 — EDM Build-up (4 bars, A Minor, 128 BPM)
Rising intensity via pitch + velocity escalation:

  add_notes([
    // Phase 1 (0-1): sparse, low
    {pitch:57, start_beat:0.0,  duration:0.25, velocity:70},   // A3
    {pitch:57, start_beat:0.5,  duration:0.25, velocity:72},   // A3
    // Phase 2 (1-2): double density
    {pitch:60, start_beat:1.0,  duration:0.25, velocity:76},   // C4
    {pitch:60, start_beat:1.25, duration:0.25, velocity:78},   // C4
    {pitch:60, start_beat:1.5,  duration:0.25, velocity:80},   // C4
    {pitch:60, start_beat:1.75, duration:0.25, velocity:82},   // C4
    // Phase 3 (2-3): rising, 16th notes
    {pitch:64, start_beat:2.0,  duration:0.25, velocity:84},   // E4
    {pitch:64, start_beat:2.25, duration:0.25, velocity:86},   // E4
    {pitch:67, start_beat:2.5,  duration:0.25, velocity:90},   // G4
    {pitch:67, start_beat:2.75, duration:0.25, velocity:92},   // G4
    // Phase 4 (3-4): maximum density, highest pitch
    {pitch:69, start_beat:3.0,  duration:0.25, velocity:96},   // A4
    {pitch:69, start_beat:3.25, duration:0.25, velocity:98},   // A4
    {pitch:72, start_beat:3.5,  duration:0.25, velocity:105},  // C5
    {pitch:72, start_beat:3.75, duration:0.25, velocity:110}   // C5 (peak → DROP incoming)
  ])

EXAMPLE 3 — Jazz Walking Bass (8 bars, C Major, ii-V-I progression)
Smooth quarter-note walk with chromatic passing tones:

  add_notes([
    // Bar 1-2: Dm7 (ii)
    {pitch:38, start_beat:0.0, duration:1.0, velocity:90},   // D2  (root)
    {pitch:41, start_beat:1.0, duration:0.5, velocity:85},   // F2  (3rd)
    {pitch:42, start_beat:1.5, duration:0.5, velocity:75},   // F#2 (chromatic passing → G)
    {pitch:43, start_beat:2.0, duration:1.0, velocity:88},   // G2  (resolve)
    {pitch:41, start_beat:3.0, duration:0.5, velocity:80},   // F2
    {pitch:40, start_beat:3.5, duration:0.5, velocity:75},   // E2
    // Bar 3-4: G7 (V)
    {pitch:38, start_beat:4.0, duration:1.0, velocity:90},   // D2
    {pitch:43, start_beat:5.0, duration:1.0, velocity:82},   // G2
    {pitch:47, start_beat:6.0, duration:1.0, velocity:85},   // B2
    {pitch:43, start_beat:7.0, duration:1.0, velocity:78},   // G2
    // Bar 5-8: Cmaj7 (I) — simpler, relaxed
    {pitch:36, start_beat:8.0, duration:2.0, velocity:88},   // C2
    {pitch:40, start_beat:10.0, duration:2.0, velocity:82},  // E2
    {pitch:43, start_beat:12.0, duration:2.0, velocity:85},  // G2
    {pitch:36, start_beat:14.0, duration:2.0, velocity:80}   // C2 (land on tonic)
  ])

═══════════════════════════════════════════════════════════
CRITICAL COMPOSITION RULES
═══════════════════════════════════════════════════════════

✅ RULE 1 — MOTIF-DRIVEN COMPOSITION
INVENT a short 2-5 note rhythm idea FIRST, then develop it across 4+ repetitions:
  Motif:  C4 · E4 G4 ·  (rest on beat 1, hit on 1.5, long on 2.0)
  Repeat: C4 · E4 G4 ·  (exact copy — builds familiarity)
  Transpose up 4th: F4 · A4 C5 ·  (same rhythm, higher = more exciting)
  Vary:   F4 E4 D4 ·· C4 (different rhythm, descending resolution)
A real melody = motif × variations, NOT a continuous up-down scale.

✅ RULE 2 — CHORD-TONE DWELLING
On strong beats (1, 3 in 4/4), notes MUST be chord tones of the implied chord.
Use the chord progression from set_chords() as your compass:
  If chord is C major (C-E-G): strong beats should be C(60), E(64), or G(67)
  Non-chord tones (D, F, A, B) are PASSING notes — use on weak beats and off-beats only
The system will auto-correct out-of-scale notes. Check the analysis to learn.

✅ RULE 3 — RHYTHMIC BREATHING
Every 1-2 beats of melody MUST be followed by 0.25-0.5 beat of silence.
Phrase groups of 2-4 beats MUST be separated by 0.5-1.0 beat rest.
This creates natural "breathing" — the #1 difference between human and robot playing.
Never connect all notes back-to-back. Think of how a singer needs to breathe.

✅ RULE 4 — DYNAMIC SHAPING
Every phrase MUST have a velocity arc — never flat:
  Pop chorus: 80 → 90 → 105 → 95 → 75 (bell curve)
  Build-up:   65 → 72 → 80 → 88 → 96 → 108 (linear rise)
  Ballad:     55 → 60 → 75 → 65 → 50 → 45 (gentle arc)
Velocity variation per phrase: at least ±15 range (e.g., 70-100, not all 85).

✅ RULE 5 — LEAP + STEP BALANCE
After any leap of ≥4 semitones, resolve by step in the OPPOSITE direction.
  Good: E4↑G4↑C5↓B4↓G4   (leap up to C, then step down through B)
  Good: C5↓A4↓F4↑G4↑A4   (leap down to F, then step up)
  Bad:  C4↑D4↑E4↑F4↑G4   (pure scale = robot)
  Bad:  C4↑G4↑C5↑G5      (only leaps = disconnected)

✅ RULE 6 — SECTION CONTRAST
Adjacent sections MUST feel different:
  Verse: mid-range (55-72), medium velocity (65-85), conversational rhythm
  Chorus: higher (65-84), louder (85-110), simpler/more memorable rhythm
  Bridge: different pitch range or rhythm pattern than verse
When transitioning from verse to chorus, chorus melody should be HIGHER and LOUDER.

✅ RULE 7 — HUMANIZATION
No two consecutive notes should have exactly the same velocity.
Occasional very slight "off-grid" feeling: use dotted rhythms (0.75, 1.5) where straight 8ths would be predictable.
Avoid mechanical exact repetition — vary at least 1 element (pitch/rhythm/velocity) in each repeat.

MULTI-TRACK WORKFLOW:
- Default track is "旋律". Use add_track() to create Bass/Chords/Pad/etc.
- Compose ONE TRACK at a time. Finish the melody, then switch to bass, then chords.
- Typical order: melody → bass → chords → countermelody
- Use track_index parameter: add_notes([...], track_index=0) for melody, track_index=1 for bass
- Each track should have a distinct register: Bass (36-50), Chords (48-67), Melody (60-84), Pad (55-72)

WORKFLOW CHECKLIST (before generating ANY notes):
1. Call get_state() to know current key/BPM/tracks
2. Call set_section() to declare the song section(s)
3. Call set_chords() to define the chord progression
4. Call get_notes() to see what already exists
5. Plan your MOTIF for THIS section
6. Generate notes with proper chord-tone placement + rhythmic breathing + dynamic arc
7. After generating, call analyze_melody() to get feedback and self-correct if needed`;

let techniquesContent = '';
let currentPromptName = 'techniques';

async function loadTechniques(promptName = currentPromptName) {
  try {
    const resp = await fetch(`/api/techniques?name=${encodeURIComponent(promptName)}`);
    if (resp.ok) {
      techniquesContent = await resp.text();
      currentPromptName = promptName;
    }
  } catch(e) {
    techniquesContent = '';
  }
}

async function loadPromptList() {
  try {
    const resp = await fetch('/api/prompts');
    if (resp.ok) {
      const data = await resp.json();
      return data.prompts || [];
    }
  } catch(e) {
    console.warn('Failed to load prompt list:', e);
  }
  return [{ name: 'techniques', filename: 'techniques.md' }];
}

function buildSystemPrompt() {
  if (techniquesContent) {
    return SYSTEM_PROMPT_BASE + '\n\n' + techniquesContent;
  }
  return SYSTEM_PROMPT_BASE;
}

const TOOLS = [
  {type:"function",function:{name:"add_note",description:"Add a note. Use track_index to specify which track (0=first). Notes outside scale are auto-corrected.",
    parameters:{type:"object",properties:{
      pitch:{type:"integer",description:"MIDI 36-96"},
      start_beat:{type:"number",description:"Start beat (0-based, 0.25 increments)"},
      duration:{type:"number",description:"0.25/0.5/1/2/4 beats"},
      velocity:{type:"integer",description:"1-127, default 100"},
      track_index:{type:"integer",description:"Target track index (0-based). Omit to use current track."}},
      required:["pitch","start_beat","duration"]}}},
  {type:"function",function:{name:"add_notes",description:"Batch-add notes. Use track_index to specify target track. Auto-corrects out-of-scale notes.",
    parameters:{type:"object",properties:{notes:{type:"array",
      items:{type:"object",properties:{
        pitch:{type:"integer"},start_beat:{type:"number"},
        duration:{type:"number"},velocity:{type:"integer"}},
        required:["pitch","start_beat","duration"]}},
      track_index:{type:"integer",description:"Target track index (0-based). Omit to use current track."}},
      required:["notes"]}}},
  {type:"function",function:{name:"add_track",description:"Create a new track for a separate instrument/voice layer",
    parameters:{type:"object",properties:{
      name:{type:"string",description:"Track name e.g. 和弦/低音/旋律/Bass/Chords"},
      color:{type:"string",description:"Hex color like #ff9966 (optional)"}},
      required:["name"]}}},
  {type:"function",function:{name:"switch_track",description:"Switch the active track that subsequent add_note/add_notes calls target",
    parameters:{type:"object",properties:{
      track_index:{type:"integer",description:"Track index to switch to (0-based)"}},
      required:["track_index"]}}},
  {type:"function",function:{name:"list_tracks",description:"List all tracks with IDs, names, and note counts",
    parameters:{type:"object",properties:{}}}},
  {type:"function",function:{name:"remove_note",description:"Remove a note at pitch & start_beat",
    parameters:{type:"object",properties:{
      pitch:{type:"integer"},start_beat:{type:"number"}},
      required:["pitch","start_beat"]}}},
  {type:"function",function:{name:"update_note",description:"Modify existing note. New pitch will be auto-corrected to scale if needed.",
    parameters:{type:"object",properties:{
      pitch:{type:"integer",description:"Current MIDI of the note to update, 36-96"},
      start_beat:{type:"number",description:"Current start_beat of the note to update"},
      new_pitch:{type:"integer",description:"New MIDI 36-96 (optional)"},
      new_start_beat:{type:"number",description:"New start_beat (optional)"},
      new_duration:{type:"number",description:"New duration (optional)"},
      new_velocity:{type:"integer",description:"New velocity 1-127 (optional)"}},
      required:["pitch","start_beat"]}}},
  {type:"function",function:{name:"clear_all",description:"Remove all notes",
    parameters:{type:"object",properties:{}}}},
  {type:"function",function:{name:"get_notes",description:"List all notes. Call this to check existing notes before adding new ones.",
    parameters:{type:"object",properties:{}}}},
  {type:"function",function:{name:"get_state",description:"Read current BPM, musical key, time signature and note count. Always call this first.",
    parameters:{type:"object",properties:{}}}},
  {type:"function",function:{name:"set_tempo",description:"Set BPM (40-300)",
    parameters:{type:"object",properties:{bpm:{type:"number"}},required:["bpm"]}}},
  {type:"function",function:{name:"set_key",description:"Set musical key context",
    parameters:{type:"object",properties:{
      root_note:{type:"integer",description:"MIDI root (60=C)"},
      scale_type:{type:"string",
      enum:["major","minor","pentatonic_major","pentatonic_minor","blues","dorian","mixolydian"]}},
      required:["root_note","scale_type"]}}},
  {type:"function",function:{name:"set_time_signature",description:"Set time signature",
    parameters:{type:"object",properties:{
      numerator:{type:"integer"},denominator:{type:"integer"}},
      required:["numerator","denominator"]}}},
  {type:"function",function:{name:"set_section",description:"Declare song section type for writing context. MUST call BEFORE generating notes for each section.",
    parameters:{type:"object",properties:{
      type:{type:"string",enum:["intro","verse","pre_chorus","chorus","bridge","breakdown","build_up","drop","outro"],
        description:"Section type"},
      bars:{type:"integer",description:"How many bars this section spans"}},
      required:["type","bars"]}}},
  {type:"function",function:{name:"set_chords",description:"Define chord progression for the composition. Provides chord-tone context for melody writing.",
    parameters:{type:"object",properties:{
      chords:{type:"array",description:"Array of chord objects",
        items:{type:"object",properties:{
          root:{type:"integer",description:"Root note MIDI (e.g. 60=C4)"},
          type:{type:"string",description:"chord type: maj/min/dim/aug/maj7/min7/dom7/sus4/sus2/maj9/min9/add9"},
          start_beat:{type:"number",description:"Start beat of this chord"},
          duration:{type:"number",description:"Duration in beats of this chord"}},
          required:["root","type","start_beat","duration"]}}},
      required:["chords"]}}},
  {type:"function",function:{name:"analyze_melody",description:"Get detailed analysis of current melody quality: chord-tone adherence, rhythmic variety, velocity dynamics, phrase structure, and specific improvement suggestions.",
    parameters:{type:"object",properties:{}}}},
];

const TRACK_COLORS = ['#00d4aa','#7c6cf7','#ff9966','#66ccff','#ff8866','#aaee77','#ee77cc','#ffdd44'];
let tracks = [];
let currentTrackIdx = 0;
let notes = [];
let nextTrackId = 1;

function initTracks() {
  tracks = [{ id:nextTrackId++, name:'旋律', color:TRACK_COLORS[0], channel:0, notes:[] }];
  currentTrackIdx = 0; notes = tracks[0].notes;
}
function getAllNotes() {
  const r=[]; for (const t of tracks) for (const n of t.notes) r.push({...n,_trackId:t.id,_trackName:t.name,_trackColor:t.color,_channel:t.channel}); return r;
}
function getTotalNoteCount() {
  let c=0; for (const t of tracks) c+=t.notes.length; return c;
}
function selectTrack(idx) {
  if (idx<0||idx>=tracks.length) return; currentTrackIdx=idx; notes=tracks[idx].notes; updateTrackUI();
}
function addTrack(name,color,channel) {
  tracks.push({id:nextTrackId++,name,color:color||TRACK_COLORS[tracks.length%8],channel:channel||tracks.length,notes:[]}); selectTrack(tracks.length-1); paintAll(); updateStatus();
}
function removeTrack(idx) {
  if (tracks.length<=1) return; tracks.splice(idx,1); if (currentTrackIdx>=tracks.length) currentTrackIdx=tracks.length-1; notes=tracks[currentTrackIdx].notes; paintAll(); updateStatus(); updateTrackUI();
}
function updateTrackUI() {
  const el=$('track-tabs'); if (!el) return;
  let h='';
  for (let i=0;i<tracks.length;i++) {
    const t=tracks[i], a=i===currentTrackIdx?' active':'';
    h+='<div class="track-tab'+a+'" style="border-left:3px solid '+t.color+'" onclick="window._switchTrack('+i+')"><span class="track-dot" style="background:'+t.color+'"></span>'+t.name+' <small>('+t.notes.length+')</small>'+(tracks.length>1?'<span class="track-del" onclick="event.stopPropagation();window._removeTrack('+i+')">✕</span>':'')+'</div>';
  }
  h+='<div class="track-tab track-add" onclick="window._addTrack()">+ 添加音轨</div>';
  el.innerHTML=h;
}
window._switchTrack=function(i){selectTrack(i);paintAll();updateStatus();};
window._removeTrack=removeTrack;
window._addTrack=function(){const n=['和弦','低音','铺底','Pad','Lead','琶音'];addTrack(n[tracks.length%n.length]);};

let bpm = 120;
let bars = DEF_BARS;
let messages = [];
let busy = false;
let playing = false;
let playStart = 0;
let playAnimId = null;
let audioCtx = null;
let scheduledOscs = [];
let soundPack = null;
let soundPackName = '';
let velDefault = 100;
let isDragging = false;
let dragNote = null;
let dragStartX = 0;
let dragStartBeat = 0;
let dragStartPitch = 0;
let lastDragX = 0;
let lastDragY = 0;
let dragraf = null;
let isResizing = false;
let resizeNote = null;
let currentKey = { root: 60, scale: 'major' };
let currentTimeSignature = { num: 4, den: 4 };
let currentSection = { type: 'verse', bars: 8, startBeat: 0 };
let sectionBeatCursor = 0;
let chordProgression = [];
let notesHistory = [];
let abortController = null;
let masterGainNode = null;

const STORAGE_KEY_CHAT = 'ai_piano_roll_chat';
const STORAGE_KEY_NOTES = 'ai_piano_roll_notes';

function saveChatHistory() {
  try {
    const data = { messages: messages, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(data));
  } catch(e) { console.warn('保存对话失败:', e); }
}

function loadChatHistory() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CHAT);
    if (stored) {
      const data = JSON.parse(stored);
      if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
        messages = data.messages;
        renderChatHistory();
        return true;
      }
    }
  } catch(e) { console.warn('加载对话失败:', e); }
  return false;
}

function renderChatHistory() {
  chatMsgs.innerHTML = '';
  for (const msg of messages) {
    if (msg.role === 'system') continue;
    if (msg.role === 'user') {
      chatAppend('u', '\nYou:');
      chatAppend('ut', msg.content);
    } else if (msg.role === 'assistant') {
      chatAppend('al', '\nAI:');
      chatAppend('at', msg.content || '(工具调用)');
      if (msg.tool_calls) {
        for (const tc of msg.tool_calls) {
          chatAppend('tt', '  ⚙ ' + tc.function.name);
        }
      }
    }
  }
  chatAppend('st', '—————————');
}

function saveNotesData() {
  try {
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify({
      tracks:tracks.map(function(t){return{id:t.id,name:t.name,color:t.color,channel:t.channel,notes:t.notes};}),
      bpm:bpm,key:currentKey,timeSignature:currentTimeSignature,currentTrackIdx:currentTrackIdx,timestamp:Date.now()
    }));
  } catch(e) { console.warn('保存失败:', e); }
}

function loadNotesData() {
  try {
    const s=localStorage.getItem(STORAGE_KEY_NOTES); if (!s) return false;
    const d=JSON.parse(s); if (Date.now()-d.timestamp>7*86400000) return false;
    if (d.tracks&&d.tracks.length) {tracks=d.tracks;for(const t of tracks){if(!t.id)t.id=nextTrackId++;if(!t.name)t.name='Track';if(!t.color)t.color=TRACK_COLORS[0];if(t.channel===undefined)t.channel=0;}nextTrackId=Math.max(nextTrackId,...tracks.map(function(t){return t.id;}))+1;currentTrackIdx=d.currentTrackIdx!==undefined?Math.min(d.currentTrackIdx,tracks.length-1):0;notes=tracks[currentTrackIdx].notes;}
    else if(d.notes){initTracks();tracks[0].notes=d.notes;notes=tracks[0].notes;}
    bpm=d.bpm||120;bpmInp.value=bpm;currentKey=d.key||{root:60,scale:'major'};currentTimeSignature=d.timeSignature||{num:4,den:4};
    paintAll();updateStatus();updateKeyDisplay();updateTrackUI();return true;
  } catch(e) { console.warn('加载失败:', e); } return false;
}

let saveTimer = null;
function startAutoSave() {
  saveTimer = setInterval(() => {
    if (messages.length > 1) saveChatHistory();
    if (getTotalNoteCount() > 0) saveNotesData();
  }, 30000);
}

function handleManualSave() {
  saveChatHistory();
  saveNotesData();
  statusEl.textContent = '✓ 已保存';
  setTimeout(() => updateStatus(), 2000);
}

function clearSavedData() {
  if (!confirm('确定要清除所有保存的内容吗？')) return;
  localStorage.removeItem(STORAGE_KEY_CHAT);
  localStorage.removeItem(STORAGE_KEY_NOTES);
  messages = [{role:'system',content:buildSystemPrompt()}];
  initTracks(); chatMsgs.innerHTML=''; paintAll(); updateStatus(); updateTrackUI();
  sectionBeatCursor = 0; currentSection = { type: 'verse', bars: 8, startBeat: 0 }; chordProgression = [];
  chatAppend('st', '🎹 新对话已开始');
}

const $ = id => document.getElementById(id);
const keysCv = $('keys-canvas');
const gridCv = $('grid-canvas');
const gridWrap = $('grid-wrap');
const chatMsgs = $('chat-msgs');
const chatInput = $('chat-input');
const chatSend = $('chat-send');
const statusEl = $('status');
const modalOverlay = $('modal-overlay');
const bpmInp = $('bpm-inp');
const durInp = $('dur-inp');
const velSlider = $('vel-slider');
const velLabel = $('vel-label');
const soundBadge = $('sound-badge');

// ═══ Responsive Canvas Sizing ══════════════════════════════════
function calcCellSize() {
  const availW = gridWrap.clientWidth || 800;
  const availH = window.innerHeight - toolbar.offsetHeight - statusEl.offsetHeight - 4;
  
  const minCellH = 14;
  const minCellW = 8;
  const maxCellW = 32;
  
  CELL_H = Math.max(minCellH, Math.floor(availH / N_P));
  
  const totalDivs = bars * BPB * SUBDIV;
  let cw = Math.floor((availW - KEY_W) / totalDivs);
  
  if (cw < minCellW) {
    const neededBars = Math.floor((availW - KEY_W) / (BPB * SUBDIV * minCellW));
    bars = Math.max(DEF_BARS, Math.min(64, neededBars + 2));
    CELL_W = minCellW;
  } else {
    CELL_W = Math.min(maxCellW, cw);
    const actualBars = Math.floor((availW - KEY_W) / (CELL_W * BPB * SUBDIV));
    bars = Math.max(DEF_BARS, Math.min(64, actualBars));
  }
  
  const remainingW = (availW - KEY_W) % (bars * BPB * SUBDIV);
  if (remainingW > 0 && CELL_W < maxCellW) {
    CELL_W = Math.min(maxCellW, CELL_W + 1);
  }
}

function paintAll() {
  calcCellSize();
  const tw = bars * BPB * SUBDIV * CELL_W;
  const th = N_P * CELL_H;
  const dpr = window.devicePixelRatio || 1;

  keysCv.width = KEY_W * dpr;
  keysCv.height = (HDR_H + th) * dpr;
  keysCv.style.width = KEY_W + 'px';
  keysCv.style.height = (HDR_H + th) + 'px';

  gridCv.width = tw * dpr;
  gridCv.height = (HDR_H + th) * dpr;
  gridCv.style.width = tw + 'px';
  gridCv.style.height = (HDR_H + th) + 'px';

  const gctx = gridCv.getContext('2d');
  const kctx = keysCv.getContext('2d');
  gctx.setTransform(dpr,0,0,dpr,0,0);
  kctx.setTransform(dpr,0,0,dpr,0,0);

  gctx.fillStyle = '#161616'; gctx.fillRect(0,0,tw,HDR_H+th);
  gctx.fillStyle = '#1a1a1a'; gctx.fillRect(0,0,tw,HDR_H);
  kctx.fillStyle = '#1a1a1a'; kctx.fillRect(0,0,KEY_W,HDR_H+th);
  kctx.fillStyle = '#1a1a1a'; kctx.fillRect(0,0,KEY_W,HDR_H);

  const fontSize = Math.max(7, Math.min(11, Math.floor(CELL_H * 0.65)));

  for (let i = 0; i < N_P; i++) {
    const p = MAX_P - 1 - i;
    const y = HDR_H + i * CELL_H;
    const s = p % 12;
    const isBlack = BLACK_KEYS.has(s);
    const isC = s === 0;
    let rowBg = '#161616';
    if (isC) rowBg = '#1e1e1e'; else if (isBlack) rowBg = '#181818';
    gctx.fillStyle = rowBg; gctx.fillRect(0,y,tw,CELL_H);
    gctx.strokeStyle = isBlack ? '#2a2a2a' : '#202020';
    gctx.beginPath(); gctx.moveTo(0,y+CELL_H); gctx.lineTo(tw,y+CELL_H); gctx.stroke();

    let keyBg = '#1a1a1a';
    if (isC) keyBg = '#1e1e1e'; else if (!isBlack) keyBg = '#202020';
    kctx.fillStyle = keyBg; kctx.fillRect(0,y,KEY_W,CELL_H);
    const nm = NOTE_NAMES[s] + (Math.floor(p/12)-1);
    kctx.fillStyle = isC ? '#aaaaaa' : '#777777';
    kctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`; kctx.textAlign = 'right';
    kctx.fillText(nm, KEY_W-4, y+CELL_H/2+fontSize/3-1);
  }

  for (let bar = 0; bar < bars; bar++) {
    for (let beat = 0; beat < BPB; beat++) {
      for (let sub = 0; sub < SUBDIV; sub++) {
        const x = (bar*BPB+beat)*SUBDIV*CELL_W + sub*CELL_W;
        if (sub > 0) {
          gctx.strokeStyle = '#202020'; gctx.beginPath();
          gctx.moveTo(x,HDR_H); gctx.lineTo(x,HDR_H+th); gctx.stroke();
        }
      }
      const xb = (bar*BPB+beat)*SUBDIV*CELL_W;
      gctx.strokeStyle = '#2a2a2a'; gctx.beginPath();
      gctx.moveTo(xb,HDR_H); gctx.lineTo(xb,HDR_H+th); gctx.stroke();
    }
    const xm = bar*BPB*SUBDIV*CELL_W;
    gctx.strokeStyle = '#333333'; gctx.lineWidth = 1;
    gctx.beginPath(); gctx.moveTo(xm,HDR_H); gctx.lineTo(xm,HDR_H+th); gctx.stroke();
    gctx.fillStyle = '#777777'; gctx.font = `${Math.max(8,fontSize)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`; gctx.textAlign = 'left';
    gctx.fillText(String(bar+1), xm+3, HDR_H/2+fontSize/3);
  }

  const allN = getAllNotes();
  for (const n of allN) {
    const p = n.pitch;
    if (p < MIN_P || p >= MAX_P) continue;
    const x1 = n.start_beat * SUBDIV * CELL_W;
    const y1 = HDR_H + (MAX_P-1-p) * CELL_H;
    const x2 = x1 + n.duration * SUBDIV * CELL_W;
    const y2 = y1 + CELL_H - 1;
    const isDraggingNote = isDragging && dragNote && n.pitch === dragNote.pitch && Math.abs(n.start_beat - dragNote.start_beat) < 0.001;
    const isResizingNote = isResizing && resizeNote && n.pitch === resizeNote.pitch && Math.abs(n.start_beat - resizeNote.start_beat) < 0.001;
    if (isDraggingNote) {
      gctx.fillStyle = '#ffffff'; gctx.strokeStyle = '#aaaaaa';
    } else if (isResizingNote) {
      gctx.fillStyle = '#88888888'; gctx.strokeStyle = '#888888';
    } else {
      const tc = n._trackColor || '#00d4aa';
      gctx.fillStyle = tc + '60'; gctx.strokeStyle = tc; gctx.lineWidth = 1;
    }
    gctx.fillRect(x1+1,y1+1,x2-x1-2,y2-y1-1);
    gctx.strokeRect(x1+1,y1+1,x2-x1-2,y2-y1-1);
    if (!isDraggingNote && !isResizingNote) gctx.lineWidth = 1;
  }
  updateNotesList();
}

const toolbar = document.getElementById('toolbar');

function pitchBeatFromXY(ex, ey) {
  const beat = ex / CELL_W / SUBDIV;
  const prow = Math.floor((ey - HDR_H) / CELL_H);
  if (prow < 0 || prow >= N_P) return null;
  return { pitch: MAX_P - 1 - prow, beat };
}

function findAt(pitch, beat) {
  const an = getAllNotes();
  return an.find(n => n.pitch===pitch && beat>=n.start_beat && beat<n.start_beat+n.duration);
}

function findAtRightEdge(pitch, beat, px, cellW) {
  const threshold = Math.max(4, cellW * 0.4);
  for (const n of getAllNotes()) {
    if (n.pitch !== pitch) continue;
    if (beat >= n.start_beat && beat <= n.start_beat + n.duration) {
      const rightEdgeBeat = n.start_beat + n.duration;
      const rightEdgeX = rightEdgeBeat * SUBDIV * cellW;
      const clickX = beat * SUBDIV * cellW;
      if (Math.abs(clickX - rightEdgeX) <= threshold) {
        return n;
      }
    }
  }
  return null;
}

function addNote(pitch, start, dur, vel) {
  pushHistory();
  _addNoteRaw(pitch, start, dur, vel);
}

function _addNoteRaw(pitch, start, dur, vel) {
  const filtered = notes.filter(n => !(n.pitch===pitch && Math.abs(n.start_beat-start)<0.001));
  tracks[currentTrackIdx].notes = filtered; notes = filtered;
  notes.push({pitch, start_beat:start, duration:dur, velocity:vel||velDefault});
}

function rmNote(pitch, start) {
  pushHistory();
  const filtered = notes.filter(n => !(n.pitch===pitch && Math.abs(n.start_beat-start)<0.001));
  tracks[currentTrackIdx].notes = filtered; notes = filtered;
}

gridCv.addEventListener('mousedown', e => {
  if (playing) return;
  if (e.button !== 0) return;
  const rect = gridCv.getBoundingClientRect();
  const scrollX = gridWrap.scrollLeft;
  const scrollY = gridWrap.scrollTop;
  const res = pitchBeatFromXY(e.clientX-rect.left+scrollX, e.clientY-rect.top+scrollY);
  if (!res) return;
  const snapB = Math.round(res.beat/0.25)*0.25;
  const resizeTarget = findAtRightEdge(res.pitch, res.beat, e.clientX-rect.left+scrollX, CELL_W);
  if (resizeTarget) {
    pushHistory();
    isResizing = true;
    resizeNote = resizeTarget;
    gridCv.style.cursor = 'ew-resize';
    e.preventDefault();
    return;
  }
  const ex = findAt(res.pitch, snapB);
  if (ex) {
    isDragging = true;
    dragNote = ex;
    dragStartX = e.clientX;
    dragStartBeat = ex.start_beat;
    dragStartPitch = ex.pitch;
    lastDragX = e.clientX;
    lastDragY = e.clientY;
    gridCv.style.cursor = 'grabbing';
    e.preventDefault();
  } else {
    const dur = parseFloat(durInp.value);
    addNote(res.pitch, snapB, dur);
    paintAll(); updateStatus();
  }
});

gridCv.addEventListener('mousemove', e => {
  if (playing) return;
  const rect = gridCv.getBoundingClientRect();
  const scrollX = gridWrap.scrollLeft;
  const scrollY = gridWrap.scrollTop;
  const res = pitchBeatFromXY(e.clientX-rect.left+scrollX, e.clientY-rect.top+scrollY);
  if (res) {
    const nm = NOTE_NAMES[res.pitch%12]+(Math.floor(res.pitch/12)-1);
    statusEl.textContent = `${nm} (MIDI ${res.pitch})  |  Beat ${res.beat.toFixed(2)}  |  Notes: ${notes.length}`;
    if (isResizing && resizeNote) {
      if (Math.abs(e.clientX - lastDragX) > 2) {
        let newDur = Math.max(0.25, res.beat - resizeNote.start_beat);
        newDur = Math.round(newDur / 0.25) * 0.25;
        if (Math.abs(newDur - resizeNote.duration) > 0.001) {
          resizeNote.duration = newDur;
          lastDragX = e.clientX;
          if (dragraf) cancelAnimationFrame(dragraf);
          dragraf = requestAnimationFrame(() => {
            paintAll();
            statusEl.textContent = `调整时值: ${nm} (MIDI ${res.pitch})  |  长度 ${newDur.toFixed(2)}`;
          });
        }
      }
    } else if (isDragging && dragNote) {
      if (Math.abs(e.clientX - lastDragX) > 3 || Math.abs(e.clientY - lastDragY) > 3) {
        const deltaX = e.clientX - dragStartX;
        const deltaBeat = deltaX / (SUBDIV * CELL_W);
        let newBeat = Math.max(0, dragStartBeat + deltaBeat);
        newBeat = Math.round(newBeat / 0.25) * 0.25;
        const deltaY = dragStartPitch - res.pitch;
        let newPitch = dragStartPitch;
        if (Math.abs(deltaY) >= 1) {
          newPitch = Math.max(MIN_P, Math.min(MAX_P - 1, dragStartPitch - deltaY));
          newPitch = Math.round(newPitch);
        }
        if (newPitch !== dragNote.pitch || newBeat !== dragNote.start_beat) {
          dragNote.pitch = newPitch;
          dragNote.start_beat = newBeat;
          lastDragX = e.clientX;
          lastDragY = e.clientY;
          if (dragraf) cancelAnimationFrame(dragraf);
          dragraf = requestAnimationFrame(() => {
            paintAll();
            const nm2 = NOTE_NAMES[newPitch%12]+(Math.floor(newPitch/12)-1);
            statusEl.textContent = `拖动中: ${nm2} (MIDI ${newPitch})  |  Beat ${newBeat.toFixed(2)}`;
          });
        }
      }
    } else if (!isDragging && !isResizing) {
      const hov = findAtRightEdge(res.pitch, res.beat, e.clientX-rect.left+scrollX, CELL_W);
      gridCv.style.cursor = hov ? 'ew-resize' : 'crosshair';
    }
  } else { updateStatus(); }
});

gridCv.addEventListener('mouseup', e => {
  if (isDragging && dragNote) {
    isDragging = false;
    dragNote = null;
    gridCv.style.cursor = 'crosshair';
    paintAll(); updateStatus();
  }
  if (isResizing && resizeNote) {
    isResizing = false;
    resizeNote = null;
    gridCv.style.cursor = 'crosshair';
    paintAll(); updateStatus();
  }
});

gridCv.addEventListener('mouseleave', e => {
  if (isDragging && dragNote) {
    isDragging = false;
    dragNote = null;
    gridCv.style.cursor = 'crosshair';
    paintAll(); updateStatus();
  }
  if (isResizing && resizeNote) {
    isResizing = false;
    resizeNote = null;
    gridCv.style.cursor = 'crosshair';
    paintAll(); updateStatus();
  }
});

gridCv.addEventListener('contextmenu', e => {
  e.preventDefault();
  if (playing) return;
  const rect = gridCv.getBoundingClientRect();
  const scrollX = gridWrap.scrollLeft;
  const scrollY = gridWrap.scrollTop;
  const res = pitchBeatFromXY(e.clientX-rect.left+scrollX, e.clientY-rect.top+scrollY);
  if (!res) return;
  const ex = findAt(res.pitch, res.beat);
  if (ex) { rmNote(ex.pitch, ex.start_beat); paintAll(); updateStatus(); }
});

gridWrap.addEventListener('scroll', () => {
  keysCv.style.marginTop = -gridWrap.scrollTop + 'px';
});

window.addEventListener('resize', () => { paintAll(); });

function updateStatus() {
  const tn = tracks[currentTrackIdx] ? tracks[currentTrackIdx].name : '';
  statusEl.textContent = `${tn} | ${getTotalNoteCount()}音符 | BPM:${bpm} | ${bars}小节 | ${soundPackName||'默认'}`;
}

function updateKeyDisplay() {
  const r = currentKey.root % 12;
  const o = Math.floor(currentKey.root / 12) - 1;
  const scaleNames = {
    major:'Major', minor:'Minor', pentatonic_major:'Pentatonic Major',
    pentatonic_minor:'Pentatonic Minor', blues:'Blues', dorian:'Dorian', mixolydian:'Mixolydian'
  };
  const kn = NOTE_NAMES[r] + o + ' ' + (scaleNames[currentKey.scale] || currentKey.scale);
  $('key-display').textContent = kn + ' · ' + currentTimeSignature.num + '/' + currentTimeSignature.den;
}

function pushHistory() {
  notesHistory.push(notes.map(n => ({...n})));
  if (notesHistory.length > 50) notesHistory.shift();
}

function undo() {
  if (notesHistory.length === 0) return;
  tracks[currentTrackIdx].notes = notesHistory.pop();
  notes = tracks[currentTrackIdx].notes;
  paintAll(); updateStatus();
}

// ═══ Sound Pack ═══════════════════════════════════════════════
async function loadSoundPack() {
  try {
    const resp = await fetch('/vocal/');
    if (!resp.ok) throw new Error('音效包目录不存在');
    const json = await resp.json();
    const files = json.files || [];
    if (files.length === 0) throw new Error('未找到支持的音频文件 (WAV/MP3/OGG/M4A/AAC/FLAC)');
    ensureAudio();
    const buffers = {};
    for (const file of files) {
      const fresp = await fetch('/vocal/' + encodeURIComponent(file));
      const buf = await fresp.arrayBuffer();
      const decoded = await audioCtx.decodeAudioData(buf);
      buffers[file] = decoded;
    }
    soundPack = buffers;
    const ext = files.length === 1 ? '.' + files[0].split('.').pop().toLowerCase() : '';
    soundPackName = files.length === 1 ? files[0].replace(ext, '') : `${files.length}个音效`;
    soundBadge.textContent = '🎵 ' + soundPackName;
    soundBadge.style.background = '#1a3a2a';
    soundBadge.style.color = '#44cc88';
  } catch(e) {
    soundPack = null;
    soundPackName = '';
    soundBadge.textContent = '🎵 默认音色';
    soundBadge.style.background = '';
    soundBadge.style.color = '';
  }
}

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    masterGainNode = audioCtx.createGain();
    masterGainNode.gain.value = 0.8;
    masterGainNode.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playNote(pitch, startTime, duration, vel) {
  if (!audioCtx) return;
  vel = vel || velDefault;
  if (soundPack) {
    playSample(pitch, startTime, duration, vel);
  } else {
    playSynth(pitch, startTime, duration, vel);
  }
}

function playSynth(pitch, startTime, duration, vel) {
  const freq = 440 * Math.pow(2, (pitch-69)/12);
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  const v = vel/127;
  gain.gain.setValueAtTime(v*0.25, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime+duration*0.85);
  osc.connect(gain); gain.connect(masterGainNode||audioCtx.destination);
  osc.start(startTime); osc.stop(startTime+duration);
  scheduledOscs.push(osc);
}

function playSample(pitch, startTime, duration, vel) {
  if (!audioCtx || !soundPack) return;
  const semitonesFromC4 = pitch - 60;
  const pitchRatio = Math.pow(2, semitonesFromC4 / 12);
  const v = (vel/127) * 0.8;

  const keys = Object.keys(soundPack);
  if (keys.length === 0) return;
  const decoded = soundPack[keys[0]];
  const src = audioCtx.createBufferSource();
  src.buffer = decoded;
  src.playbackRate.value = pitchRatio;

  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(v, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + Math.min(duration * 0.85, decoded.duration * 0.9));

  src.connect(gainNode);
  gainNode.connect(masterGainNode||audioCtx.destination);
  src.start(startTime);
  scheduledOscs.push(src);
}

function stopAllAudio() {
  try { for (const o of scheduledOscs) { try { o.stop(); } catch(e){} } } catch(e){}
  scheduledOscs = [];
}

function updateNotesList() {
  const listEl = $('notes-list'); if (!listEl) return;
  if (getTotalNoteCount()===0) { listEl.innerHTML='<div style="color:#444;padding:8px">暂无音符</div>'; updateNotesTitle(); return; }
  let html='';
  for (const t of tracks) { if (!t.notes.length) continue;
    html+='<div style="padding:3px 6px;border-bottom:1px solid #222;display:flex;align-items:center;gap:6px"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:'+t.color+'"></span><span style="color:#aaa;font-size:10px;font-weight:bold">'+t.name+' ('+t.notes.length+')</span></div>';
    const s=[...t.notes].sort((a,b)=>{if(a.start_beat!==b.start_beat)return a.start_beat-b.start_beat;return b.pitch-a.pitch;});
    for (const n of s) { const nm=NOTE_NAMES[n.pitch%12]+(Math.floor(n.pitch/12)-1),v=n.velocity||DEF_VEL;
      html+='<div style="padding:2px 6px 2px 20px;border-bottom:1px solid #111130;display:flex;justify-content:space-between;font-size:10px"><span style="color:#00d4aa">'+nm+'</span><span style="color:#666">'+n.start_beat.toFixed(2)+'</span><span style="color:#7c6cf7">'+n.duration.toFixed(2)+'</span><span style="color:#ff9966">'+v+'</span></div>'; }
  }
  listEl.innerHTML=html; updateNotesTitle();
}

function updateNotesTitle() {
  const e=$('notes-title'); if (e) e.innerHTML='🎼 音符列表 <span style="float:right;color:#666;font-weight:normal">共'+tracks.length+'轨 · '+getTotalNoteCount()+'个</span>';
}

function exportNotesText() {
  if (getTotalNoteCount()===0) { alert('没有音符可导出'); return; }
  let text='AI Piano Roll - 音符导出\n================================\n\nBPM:'+bpm+'\n调式:'+NOTE_NAMES[currentKey.root%12]+' '+currentKey.scale+'\n拍号:'+currentTimeSignature.num+'/'+currentTimeSignature.den+'\n音轨数:'+tracks.length+'\n音符总数:'+getTotalNoteCount()+'\n\n';
  for (const t of tracks) { if (!t.notes.length) continue;
    text+='音轨:'+t.name+' ('+t.notes.length+'音符)\n--------------------------------\n音高\t起始拍\t时值\t力度\n';
    const s=[...t.notes].sort((a,b)=>{if(a.start_beat!==b.start_beat)return a.start_beat-b.start_beat;return b.pitch-a.pitch;});
    for (const n of s) text+=NOTE_NAMES[n.pitch%12]+(Math.floor(n.pitch/12)-1)+'\t'+n.start_beat.toFixed(2)+'\t'+n.duration.toFixed(2)+'\t'+(n.velocity||DEF_VEL)+'\n';
    text+='\n';
  }
  const b=new Blob([text],{type:'text/plain;charset=utf-8'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='notes-'+new Date().toISOString().split('T')[0]+'.txt';document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u);
  statusEl.textContent='✓ 已导出'; setTimeout(()=>updateStatus(),2000);
}

function exportNotesJson() {
  if (getTotalNoteCount()===0) { alert('没有音符可导出'); return; }
  const d={version:'1.0',exportTime:new Date().toISOString(),bpm:bpm,key:currentKey,timeSignature:currentTimeSignature,tracks:tracks.map(function(t){return{id:t.id,name:t.name,color:t.color,channel:t.channel,notes:t.notes};})};
  const b=new Blob([JSON.stringify(d,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='project-'+new Date().toISOString().split('T')[0]+'.json';document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u);
  statusEl.textContent='✓ 已导出'; setTimeout(()=>updateStatus(),2000);
}

function importNotesJson(event) {
  const f=event.target.files[0]; if (!f) return; const r=new FileReader();
  r.onload=function(e){try{const d=JSON.parse(e.target.result);
    if(d.tracks&&d.tracks.length){tracks=d.tracks;for(const t of tracks){if(!t.id)t.id=nextTrackId++;if(t.channel===undefined)t.channel=0;if(!t.color)t.color=TRACK_COLORS[tracks.indexOf(t)%8];}nextTrackId=Math.max(nextTrackId,...tracks.map(function(t){return t.id;}))+1;currentTrackIdx=0;notes=tracks[0].notes;if(d.bpm){bpm=d.bpm;bpmInp.value=bpm;}if(d.key)currentKey=d.key;if(d.timeSignature)currentTimeSignature=d.timeSignature;paintAll();updateStatus();updateKeyDisplay();updateTrackUI();statusEl.textContent='✓ 已导入'+tracks.length+'音轨';}
    else if(d.notes){pushHistory();tracks[currentTrackIdx].notes=d.notes;notes=tracks[currentTrackIdx].notes;if(d.bpm){bpm=d.bpm;bpmInp.value=bpm;}if(d.key)currentKey=d.key;if(d.timeSignature)currentTimeSignature=d.timeSignature;paintAll();updateStatus();updateKeyDisplay();statusEl.textContent='✓ 已导入';}
  }catch(err){alert('导入失败:'+err.message);}}; r.readAsText(f); event.target.value='';
}

async function doMidiDownload(payload, filename) {
  const resp = await fetch('/api/midi', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
  if (!resp.ok) { const e=await resp.json().catch(()=>({})); throw new Error(e.error||`HTTP ${resp.status}`); }
  const blob=await resp.blob(), url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=filename+'.mid';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

async function downloadMidiTrack() {
  const t = tracks[currentTrackIdx];
  if (!t.notes.length) { alert('当前音轨「'+t.name+'」没有音符'); return; }
  try {
    await doMidiDownload({ tracks: [t], bpm, filename: t.name }, t.name.replace(/[\\/:*?"<>|]/g,'_'));
    statusEl.textContent = '「'+t.name+'」MIDI 已导出';
  } catch(e) { alert('MIDI 导出失败: ' + e.message); }
}

async function downloadMidiFull() {
  if (getTotalNoteCount()===0) { alert('没有音符可导出'); return; }
  try {
    await doMidiDownload({ tracks, bpm, filename: 'AMR-midi' }, 'AMR-midi');
    statusEl.textContent = '全部 '+tracks.length+' 个音轨 MIDI 已导出';
  } catch(e) { alert('MIDI 导出失败: ' + e.message); }
}

$('btn-midi-track').addEventListener('click', downloadMidiTrack);
$('btn-midi-all').addEventListener('click', downloadMidiFull);

// ═══ Playback ═════════════════════════════════════════════════
$('btn-play').addEventListener('click', () => {
  if (playing) return;
  ensureAudio();
  bpm = parseInt(bpmInp.value)||120;
  playing = true;
  playStart = audioCtx.currentTime;
  const spb = 60/bpm;
  const an = getAllNotes();
  for (const n of an) {
    playNote(n.pitch, playStart + n.start_beat*spb, n.duration*spb, n.velocity);
  }
  animatePlayhead();
});

$('btn-stop').addEventListener('click', () => {
  playing = false;
  stopAllAudio();
  if (playAnimId) cancelAnimationFrame(playAnimId);
  playAnimId = null;
  paintAll();
});

function animatePlayhead() {
  if (!playing) return;
  ensureAudio();
  const elapsed = audioCtx.currentTime - playStart;
  const beat = elapsed * bpm / 60;
  const total = bars * BPB;
  if (beat > total) { playing = false; paintAll(); updateStatus(); return; }
  paintAll();
  const gctx = gridCv.getContext('2d');
  const x = beat * SUBDIV * CELL_W;
  const sx = x - gridWrap.scrollLeft;
  gctx.strokeStyle = '#ff2255'; gctx.lineWidth = 2;
  gctx.beginPath(); gctx.moveTo(sx, HDR_H); gctx.lineTo(sx, HDR_H+N_P*CELL_H); gctx.stroke();
  gctx.lineWidth = 1;
  playAnimId = requestAnimationFrame(animatePlayhead);
}

$('btn-clear').addEventListener('click', () => {
  if (!notes.length || !confirm('清除「'+tracks[currentTrackIdx].name+'」音轨所有音符？')) return;
  pushHistory();
  tracks[currentTrackIdx].notes=[]; notes=[]; paintAll(); updateStatus();
});

bpmInp.addEventListener('change', () => { bpm = parseInt(bpmInp.value)||120; updateStatus(); });
velSlider.addEventListener('input', () => { velDefault = parseInt(velSlider.value); velLabel.textContent = velDefault; });
velSlider.addEventListener('change', () => { velDefault = parseInt(velSlider.value); });

$('vol-slider').addEventListener('input', () => {
  const vol = parseInt($('vol-slider').value) / 100;
  if (masterGainNode) masterGainNode.gain.value = vol;
});

// ═══ Chat ════════════════════════════════════════════════════
function chatAppend(cls, text) {
  const div = document.createElement('div');
  div.className = cls; div.textContent = text;
  chatMsgs.appendChild(div);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

let thinkingDiv = null;

function showThinking() {
  hideThinking();
  thinkingDiv = document.createElement('div');
  thinkingDiv.className = 'think';
  thinkingDiv.innerHTML = '<span style="font-size:12px;margin-right:2px">AI 思考中</span><span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  chatMsgs.appendChild(thinkingDiv);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

function hideThinking() {
  if (thinkingDiv && thinkingDiv.parentNode) {
    thinkingDiv.parentNode.removeChild(thinkingDiv);
  }
  thinkingDiv = null;
}

function renderMarkdown(text) {
  let html = escapeHtml(text);

  html = html.replace(/^#{4} (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return '<pre><code>' + code.replace(/\n$/, '') + '</code></pre>';
  });
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  html = html.replace(/(?:^|\n)(\d+)\. (.+)/g, (m, num, text, offset) => {
    const before = html.substring(0, offset);
    if (/(?:<li>|<ol>)/.test(before.slice(-200))) return '<li>' + text + '</li>';
    return '\n<ol>\n<li>' + text + '</li>\n</ol>';
  });
  html = html.replace(/<\/ol>\n<ol>/g, '');
  html = html.replace(/(?:^|\n)[-*] (.+)/g, (m, text, offset) => {
    const before = html.substring(0, offset);
    if (/<li>/.test(before.slice(-200)) && !/<\/(ol|ul)>/.test(before.slice(-200))) {
      return '<li>' + text + '</li>';
    }
    return '\n<ul>\n<li>' + text + '</li>\n</ul>';
  });
  html = html.replace(/<\/ul>\n<ul>/g, '');

  html = html.replace(/^---$/gm, '<hr>');

  html = html.replace(/\n\n/g, '<br><br>');
  html = html.replace(/\n/g, '<br>');

  return html;
}

function finalizeReasoning(reasoningDiv, reasoningContent) {
  if (!reasoningDiv || !reasoningDiv.parentNode) return;
  if (!reasoningContent) { reasoningDiv.parentNode.removeChild(reasoningDiv); return; }
  const details = document.createElement('details');
  details.className = 'reasoning';
  details.innerHTML = '<summary>💭 思考过程</summary><div class="rc">' + renderMarkdown(reasoningContent) + '</div>';
  reasoningDiv.parentNode.replaceChild(details, reasoningDiv);
}

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function chatSendMsg() {
  if (busy) return;
  const txt = chatInput.value.trim();
  if (!txt) return;
  chatInput.value = '';
  chatAppend('u', '\nYou:');
  chatAppend('ut', txt);
  messages.push({role:'user',content:txt});
  busy = true;
  chatSend.disabled = true;
  $('chat-stop').style.display = 'inline-block';
  statusEl.textContent = 'AI 正在思考…';
  showThinking();
  abortController = new AbortController();
  let iterations = 0;
  const MAX_ITER = 20;

  try {
    while (iterations < MAX_ITER) {
      iterations++;

      const body = {model: loadCfgModel(), messages, tools:TOOLS, stream: true};
      const resp = await fetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(body),
        signal: abortController.signal
      });

      if (!resp.ok) {
        const e = await resp.json().catch(()=>({}));
        throw new Error(e.error||`HTTP ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let sseBuf = '';
      let streamError = null;
      let toolCallsMsg = null;
      let aiContent = '';
      let aiDiv = null;
      let reasoningContent = '';
      let reasoningDiv = null;
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) { streamDone = true; break; }

        sseBuf += decoder.decode(value, { stream: true });
        const lines = sseBuf.split('\n');
        sseBuf = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            switch (evt.type) {
            case 'text':
              if (!aiDiv) {
                hideThinking();
                chatAppend('al', '\nAI:');
                aiDiv = document.createElement('div');
                aiDiv.className = 'at';
                chatMsgs.appendChild(aiDiv);
              }
              aiContent += evt.content;
              aiDiv.innerHTML = renderMarkdown(aiContent);
              chatMsgs.scrollTop = chatMsgs.scrollHeight;
              break;
            case 'tool_calls':
              toolCallsMsg = evt.message;
              break;
            case 'reasoning':
              if (!reasoningDiv) {
                hideThinking();
                const wrap = document.createElement('div');
                wrap.className = 'reasoning-stream';
                wrap.textContent = '';
                chatMsgs.appendChild(wrap);
                reasoningDiv = wrap;
              }
              reasoningContent += evt.content;
              reasoningDiv.innerHTML = renderMarkdown(reasoningContent);
              chatMsgs.scrollTop = chatMsgs.scrollHeight;
              break;
            case 'reasoning_done':
              reasoningContent = evt.content;
              break;
            case 'done':
              streamDone = true;
              break;
            case 'error':
              streamError = new Error(evt.message);
              streamDone = true;
              break;
            }
          } catch(e) { /* skip incomplete JSON */ }
        }
      }

      if (streamError) throw streamError;

      if (toolCallsMsg) {
        messages.push(toolCallsMsg);
        for (const tc of toolCallsMsg.tool_calls) {
          const fn = tc.function.name;
          const args = JSON.parse(tc.function.arguments);
          const res = execTool(fn, args);
          chatAppend('tt', `  ⚙ ${fn}(${JSON.stringify(args).slice(0,80)})`);
          messages.push({role:'tool',tool_call_id:tc.id,content:JSON.stringify(res)});
        }
        finalizeReasoning(reasoningDiv, reasoningContent);
        showThinking();
        statusEl.textContent = 'AI 正在思考…';
        continue;
      }

      finalizeReasoning(reasoningDiv, reasoningContent);
      if (aiContent) {
        const am = {role:'assistant',content:aiContent};
        if (reasoningContent) am.reasoning_content = reasoningContent;
        messages.push(am);
      } else if (reasoningContent) {
        messages.push({role:'assistant',content:'',reasoning_content:reasoningContent});
      }
      break;
    }

    if (iterations >= MAX_ITER) {
      chatAppend('et', '\n⚠ 达到最大迭代次数（' + MAX_ITER + '），对话已终止');
    }
  } catch(e) {
    if (e.name === 'AbortError') {
      chatAppend('tt', '\n⏹ 已停止生成');
    } else {
      chatAppend('et', '\n⚠ '+e.message);
    }
  } finally {
    hideThinking();
    busy = false;
    chatSend.disabled = false;
    $('chat-stop').style.display = 'none';
    abortController = null;
    paintAll(); updateStatus();
  }
}

chatSend.addEventListener('click', chatSendMsg);
chatInput.addEventListener('keydown', e => { if (e.key==='Enter') chatSendMsg(); });

$('chat-stop').addEventListener('click', () => {
  if (abortController) { abortController.abort(); }
});

$('btn-new-chat').addEventListener('click', () => {
  messages = [{role:'system',content:buildSystemPrompt()}];
  chatMsgs.innerHTML = '';
  sectionBeatCursor = 0;
  currentSection = { type: 'verse', bars: 8, startBeat: 0 };
  chordProgression = [];
  chatAppend('st', '🎹  新对话已开始');
  chatAppend('st', '—————————');
  statusEl.textContent = '新对话已就绪';
});

// ═══ Tool Execution ══════════════════════════════════════════
function execTool(name, args) {
  try {
    function targetNotes(tidx) {
      if (tidx !== undefined && tidx >= 0 && tidx < tracks.length) return tracks[tidx].notes;
      return notes;
    }
    switch(name) {
    case 'add_note': {
      let p=args.pitch, s=args.start_beat, d=args.duration, v=args.velocity;
      const tn = targetNotes(args.track_index);
      const analysis = analyzeNewNotes([{pitch:p, start_beat:s, duration:d, velocity:v}], tn);
      if (analysis.violations.length > 0) { p = analysis.violations[0].corrected; }
      tn.push({pitch:p, start_beat:s, duration:d, velocity:v||velDefault});
      paintAll();
      const result = {ok:true, note:NOTE_NAMES[p%12]+(Math.floor(p/12)-1), beat:s, dur:d};
      if (args.track_index !== undefined) result.track = tracks[args.track_index].name;
      if (analysis.violations.length > 0) result.warning = '修正: '+analysis.violations[0].original+'→'+p;
      return result;
    }
    case 'add_notes': {
      const tn = targetNotes(args.track_index);
      const analysis = analyzeNewNotes(args.notes, tn);
      pushHistory();
      let c=0;
      let humanizedCount = 0;
      for (const nt of args.notes) {
        let vel = nt.velocity || velDefault;
        if (!nt.velocity) {
          vel = vel + Math.round((Math.random() - 0.5) * 12);
          vel = Math.max(1, Math.min(127, vel));
          humanizedCount++;
        }
        tn.push({pitch:nt.pitch,start_beat:nt.start_beat,duration:nt.duration,velocity:vel}); c++;
      }
      paintAll();
      const result = {ok:true, count:c};
      if (humanizedCount > 0) result.humanized = humanizedCount + ' notes received slight velocity variation (±6) for natural feel';
      if (args.track_index !== undefined) { result.track = tracks[args.track_index].name; result.track_index = args.track_index; }
      if (analysis.violations.length>0||analysis.dissonances.length>0) {
        result.analysis = { out_of_scale:analysis.violations.length, corrected:analysis.violations.map(function(v){return{original:v.original,fixed_to:v.corrected,beat:v.beat};}), dissonant_pairs:analysis.dissonances.slice(0,8), dissonant_count:analysis.dissonances.length };
        if (analysis.violations.length>0) result.analysis.summary=analysis.violations.length+'个音符已修正至'+NOTE_NAMES[currentKey.root%12]+' '+currentKey.scale+'音阶';
      }
      if (chordProgression.length > 0) {
        let chordHitCount = 0, strongBeatCount = 0;
        for (const nt of args.notes) {
          const beatInBar = nt.start_beat % 4;
          if (Math.abs(beatInBar - Math.round(beatInBar)) < 0.01 && (Math.round(beatInBar) === 0 || Math.round(beatInBar) === 2)) {
            strongBeatCount++;
            const chord = chordProgression.find(function(c){return nt.start_beat>=c.start_beat && nt.start_beat<c.start_beat+c.duration;});
            if (chord) {
              const tones = getChordTones(chord.root, chord.type);
              if (tones.some(function(t){return Math.abs(t%12 - nt.pitch%12) < 1;})) chordHitCount++;
            }
          }
        }
        if (strongBeatCount > 0) {
          result.chord_analysis = {strong_beats:strongBeatCount, chord_tone_hits:chordHitCount, rate: (chordHitCount/strongBeatCount*100).toFixed(0)+'%'};
        }
      }
      return result;
    }
    case 'add_track': {
      const name = args.name || 'Track';
      addTrack(name, args.color);
      return {ok:true, track_index:tracks.length-1, name:name, total_tracks:tracks.length};
    }
    case 'switch_track': {
      const idx = args.track_index;
      if (idx<0||idx>=tracks.length) return {error:'无效音轨索引: '+idx+' (共'+tracks.length+'条)'};
      selectTrack(idx); notes=tracks[idx].notes; paintAll(); updateStatus();
      return {ok:true, track_index:idx, name:tracks[idx].name, note_count:tracks[idx].notes.length};
    }
    case 'list_tracks': {
      return { tracks: tracks.map(function(t,i){ return {index:i,id:t.id,name:t.name,channel:t.channel,color:t.color,note_count:t.notes.length}; }), total:tracks.length };
    }
    case 'remove_note': {
      const b4=notes.length;
      rmNote(args.pitch, args.start_beat);
      paintAll(); return {ok: notes.length<b4};
    }
    case 'update_note': {
      const idx = notes.findIndex(n => n.pitch===args.pitch && Math.abs(n.start_beat-args.start_beat)<0.001);
      if (idx === -1) return {error:'note not found'};
      pushHistory();
      if (args.new_pitch !== undefined) {
        let np = args.new_pitch;
        if (!isInScale(np, currentKey.root, currentKey.scale)) {
          np = snapToScale(np, currentKey.root, currentKey.scale);
        }
        notes[idx].pitch = np;
      }
      if (args.new_start_beat !== undefined) notes[idx].start_beat = args.new_start_beat;
      if (args.new_duration !== undefined) notes[idx].duration = args.new_duration;
      if (args.new_velocity !== undefined) notes[idx].velocity = args.new_velocity;
      paintAll();
      return {ok:true, updated:NOTE_NAMES[notes[idx].pitch%12]+(Math.floor(notes[idx].pitch/12)-1)};
    }
    case 'clear_all':
      pushHistory();
      tracks[currentTrackIdx].notes=[]; notes=[]; paintAll(); return {ok:true, track:tracks[currentTrackIdx].name};
    case 'get_notes': {
      const r = [];
      for (const tn of tracks) r.push({track_index:tracks.indexOf(tn),name:tn.name,note_count:tn.notes.length,notes:tn.notes});
      return {tracks:r,current_track_index:currentTrackIdx,current_track:r[currentTrackIdx],total_note_count:getTotalNoteCount()};
    }
    case 'get_state':
      return {
        bpm, tempo:bpm,
        key:{root:currentKey.root, scale:currentKey.scale, name:NOTE_NAMES[currentKey.root%12]+' '+currentKey.scale},
        time_signature:{numerator:currentTimeSignature.num, denominator:currentTimeSignature.den},
        note_count: getTotalNoteCount(),
        tracks: tracks.map(function(t,i){return{index:i,id:t.id,name:t.name,channel:t.channel,note_count:t.notes.length};}),
        current_track:{index:currentTrackIdx,name:tracks[currentTrackIdx].name,notes:tracks[currentTrackIdx].notes.length},
        section: {type:currentSection.type, bars:currentSection.bars, start_beat:currentSection.startBeat},
        chords: chordProgression.length > 0 ? chordProgression.map(function(c){return NOTE_NAMES[c.root%12]+c.type+'@'+c.start_beat.toFixed(1);}) : []
      };
    case 'set_tempo':
      bpm=Math.max(40,Math.min(300,args.bpm));
      bpmInp.value=bpm; updateStatus();
      return {ok:true, bpm};
    case 'set_key':
      currentKey = { root: args.root_note, scale: args.scale_type };
      updateKeyDisplay();
      return {ok:true, key:NOTE_NAMES[args.root_note%12]+' '+args.scale_type};
    case 'set_time_signature':
      currentTimeSignature = { num: args.numerator, den: args.denominator };
      updateKeyDisplay();
      return {ok:true, ts:args.numerator+'/'+args.denominator};
    case 'set_section': {
      currentSection = { type: args.type, bars: args.bars, startBeat: sectionBeatCursor };
      sectionBeatCursor += args.bars;
      const sectionGuidance = {
        intro:    {range:[50,60], vel:[50,65], density:'sparse',   tip:'Build anticipation — use only 2-3 pitches, leave lots of space'},
        verse:    {range:[55,72], vel:[65,85], density:'moderate', tip:'Conversational rhythm, 4-bar phrases with rests between'},
        pre_chorus:{range:[60,76], vel:[75,95], density:'building',tip:'Rising energy, notes get higher, velocity increases'},
        chorus:   {range:[65,84], vel:[85,110],density:'full',    tip:'THE HOOK — higher register, strongest rhythm, fill the space'},
        bridge:   {range:[55,72], vel:[70,85], density:'contrasting',tip:'Different progression and feel from verse/chorus'},
        breakdown:{range:[48,65], vel:[50,70], density:'sparse',  tip:'Strip back, create tension, prepare for climax'},
        build_up: {range:[55,78], vel:[70,110],density:'rising',  tip:'Ascending pitch + velocity crescendo, shorter note values'},
        drop:     {range:[65,84], vel:[95,120],density:'maximum', tip:'Full energy, dense arrangement, high velocity'},
        outro:    {range:[48,60], vel:[50,65], density:'fading',  tip:'Descending contour, decreasing velocity, resolve to tonic'}
      };
      const g = sectionGuidance[args.type] || sectionGuidance.verse;
      return {
        ok:true,
        section: args.type,
        bars: args.bars,
        start_beat: currentSection.startBeat,
        guidance: g
      };
    }
    case 'set_chords': {
      chordProgression = args.chords.map(function(c) {
        return {root:c.root, type:c.type, start_beat:c.start_beat, duration:c.duration};
      });
      return {
        ok:true,
        chords: chordProgression.map(function(c) {
          return NOTE_NAMES[c.root%12] + ' ' + c.type + ' @ beat ' + c.start_beat.toFixed(2);
        }),
        chord_tones: chordProgression.map(function(c) {
          return {chord:NOTE_NAMES[c.root%12]+' '+c.type, tones:getChordTones(c.root, c.type).map(function(p){return NOTE_NAMES[p%12]+(Math.floor(p/12)-1);})};
        })
      };
    }
    case 'analyze_melody': {
      const allN = getAllNotes();
      if (allN.length === 0) return {score:0, summary:'暂无音符可分析', suggestions:['先添加一些音符再分析']};
      let chordToneHits = 0, chordToneTotal = 0;
      if (chordProgression.length > 0) {
        for (const n of allN) {
          const beat = n.start_beat;
          const chord = chordProgression.find(function(c){return beat>=c.start_beat && beat<c.start_beat+c.duration;});
          if (chord) {
            const tones = getChordTones(chord.root, chord.type);
            chordToneTotal++;
            if (tones.includes(n.pitch)) chordToneHits++;
          }
        }
      }
      const durCounts = {};
      for (const n of allN) { const d = n.duration; durCounts[d] = (durCounts[d]||0)+1; }
      const uniqueDurs = Object.keys(durCounts).length;
      const vels = allN.map(function(n){return n.velocity||100;});
      const velMin = Math.min.apply(null, vels), velMax = Math.max.apply(null, vels);
      const velSpread = velMax - velMin;
      const sorted = allN.slice().sort(function(a,b){return a.start_beat-b.start_beat;});
      let restCount = 0, backToBack = 0;
      for (let i=1;i<sorted.length;i++) {
        const prevEnd = sorted[i-1].start_beat + sorted[i-1].duration;
        const nextStart = sorted[i].start_beat;
        if (nextStart - prevEnd > 0.2) restCount++;
        if (nextStart - prevEnd < 0.01) backToBack++;
      }
      const pitches = allN.map(function(n){return n.pitch;});
      let leapCount = 0, stepCount = 0;
      for (let i=1;i<pitches.length;i++) { const diff=Math.abs(pitches[i]-pitches[i-1]); if(diff<=2)stepCount++; else if(diff>=4)leapCount++; }
      const suggestions = [];
      if (chordToneTotal > 0 && chordToneHits/chordToneTotal < 0.6) suggestions.push('强拍上的音符与和弦音匹配率仅 '+(chordToneHits/chordToneTotal*100).toFixed(0)+'%，建议检查 set_chords() 定义的和弦进行，让强拍音符落在和弦音上');
      if (uniqueDurs < 3) suggestions.push('节奏缺少变化，仅用了 '+uniqueDurs+' 种时值。建议至少混用 3 种不同时值 (0.25/0.5/0.75/1.0/1.5/2.0)');
      if (velSpread < 15) suggestions.push('力度变化太小 (范围仅'+velSpread+')，真人演奏至少需要 ±15 的动态范围');
      if (backToBack > allN.length * 0.6) suggestions.push('音符连接太紧密 ('+backToBack+'/'+allN.length+'连续无休止)，需要更多呼吸空间');
      if (restCount < 3 && allN.length > 8) suggestions.push('只有 '+restCount+' 处休止，建议每 4 小节至少 2 处明显停顿');
      if (leapCount > stepCount * 2) suggestions.push('跳进过多 ('+leapCount+' 次跳进 vs '+stepCount+' 次级进)，旋律不够连贯');
      let score = 5;
      score += (chordToneTotal>0 ? Math.min(2,chordToneHits/chordToneTotal*2) : 0);
      score += Math.min(2, uniqueDurs/3);
      score += Math.min(1, velSpread/20);
      score += Math.min(1, Math.max(0,1-backToBack/allN.length)*2);
      score = Math.min(10, Math.round(score));
      return {
        score: score,
        summary: score>=8?'优秀':score>=6?'良好':score>=4?'一般':'需要改进',
        details: {
          total_notes: allN.length,
          unique_durations: uniqueDurs, duration_distribution: durCounts,
          velocity_range: velMin+'–'+velMax, velocity_spread: velSpread,
          rests_between_notes: restCount, back_to_back_count: backToBack,
          leaps: leapCount, steps: stepCount, leap_step_ratio: stepCount>0?(leapCount/stepCount).toFixed(1):'∞',
          chord_tone_rate: chordToneTotal>0?(chordToneHits/chordToneTotal*100).toFixed(0)+'%':'无和弦定义',
          section: currentSection.type + ' ('+currentSection.bars+' bars)'
        },
        suggestions: suggestions.length>0?suggestions:['当前旋律各项指标良好！'],
        section_guidance: {
          type: currentSection.type, bars: currentSection.bars,
          recommended_range: currentSection.type==='chorus'||currentSection.type==='drop'?'65-84':currentSection.type==='verse'?'55-72':'50-80',
          recommended_velocity: currentSection.type==='chorus'||currentSection.type==='drop'?'85-110':'65-85'
        }
      };
    }
    default: return {error:'unknown tool'};
    }
  } catch(e) { return {error:e.message}; }
}

// ═══ Config ══════════════════════════════════════════════════
function loadCfgModel() {
  try { return JSON.parse(localStorage.getItem('ai_piano_cfg')||'{}').model||'gpt-4o'; }
  catch { return 'gpt-4o'; }
}

$('btn-config').addEventListener('click', async () => {
  modalOverlay.classList.add('active');
  $('cfg-feedback').className = ''; $('cfg-feedback').textContent = '';
  
  const promptSelect = $('cfg-prompt');
  promptSelect.innerHTML = '';
  
  const prompts = await loadPromptList();
  for (const p of prompts) {
    const opt = document.createElement('option');
    opt.value = p.name;
    opt.textContent = p.name.replace(/-/g, ' ');
    promptSelect.appendChild(opt);
  }
  
  try {
    const resp = await fetch('/api/config');
    const cfg = await resp.json();
    document.querySelector('input[name="cfg-provider"][value="'+cfg.provider+'"]').checked = true;
    $('cfg-url').value = cfg.base_url || 'https://api.openai.com/v1';
    $('cfg-key').value = cfg.api_key || '';
    $('cfg-model').value = cfg.model || 'gpt-4o';
    promptSelect.value = cfg.prompt || 'techniques';
    updateKeyHint();
  } catch(e) {
    document.querySelector('input[name="cfg-provider"][value="cloud"]').checked = true;
    $('cfg-url').value = 'https://api.openai.com/v1';
    $('cfg-key').value = '';
    $('cfg-model').value = 'gpt-4o';
    promptSelect.value = 'techniques';
    updateKeyHint();
  }
});

function updateKeyHint() {
  const isLocal = document.querySelector('input[name="cfg-provider"]:checked').value === 'local';
  const hint = $('cfg-key-hint');
  const keyInput = $('cfg-key');
  if (hint) hint.style.display = isLocal ? 'inline' : 'none';
  if (keyInput) keyInput.placeholder = isLocal ? '本地模型可留空' : 'sk-...';
}

document.querySelectorAll('input[name="cfg-provider"]').forEach(r => {
  r.addEventListener('change', updateKeyHint);
});

$('cfg-test').addEventListener('click', async () => {
  const fb = $('cfg-feedback');
  const btn = $('cfg-test');
  const cfg = {
    provider: document.querySelector('input[name="cfg-provider"]:checked').value,
    base_url: $('cfg-url').value.trim(),
    api_key: $('cfg-key').value.trim(),
    model: $('cfg-model').value.trim(),
  };
  if (!cfg.base_url) { fb.className='err'; fb.textContent='请先输入 Base URL'; return; }
  if (!cfg.model) { fb.className='err'; fb.textContent='请输入模型名称'; return; }
  btn.disabled = true;
  fb.className = ''; fb.textContent = '正在测试连接…';
  try {
    const resp = await fetch('/api/test', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(cfg)
    });
    if (!resp.ok) {
      const e = await resp.json().catch(()=>({}));
      throw new Error(e.error||`HTTP ${resp.status}`);
    }
    const data = await resp.json();
    fb.className = 'ok';
    fb.textContent = `✅ 连接成功 (${data.ms}ms, ${data.model})`;
  } catch(e) {
    fb.className = 'err';
    fb.textContent = `❌ ${e.message}`;
  } finally {
    btn.disabled = false;
  }
});

$('cfg-cancel').addEventListener('click', () => { modalOverlay.classList.remove('active'); });
$('cfg-save').addEventListener('click', async () => {
  const cfg = {
    provider: document.querySelector('input[name="cfg-provider"]:checked').value,
    base_url: $('cfg-url').value.trim(),
    api_key: $('cfg-key').value.trim(),
    model: $('cfg-model').value.trim(),
    prompt: $('cfg-prompt').value,
  };
  if (!cfg.base_url) { alert('请输入 Base URL'); return; }
  if (!cfg.model) { alert('请输入模型名称'); return; }
  try {
    const resp = await fetch('/api/config', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(cfg)
    });
    if (!resp.ok) throw new Error('保存失败');
    localStorage.setItem('ai_piano_cfg', JSON.stringify(cfg));
    
    await loadTechniques(cfg.prompt);
    
    modalOverlay.classList.remove('active');
    messages = [{role:'system',content:buildSystemPrompt()}];
    
    const promptDisplayName = cfg.prompt.replace(/-/g, ' ');
    chatAppend('st', '—————————');
    chatAppend('st', `🎵 用户已选择「${promptDisplayName}」创作指南`);
    chatAppend('st', `🎹 我将以「${promptDisplayName}」风格创作指南来操作`);
    chatAppend('st', '—————————');
    
    statusEl.textContent = '配置已保存，提示词已更新';
  } catch(e) {
    alert('保存配置失败: '+e.message);
  }
});

modalOverlay.addEventListener('click', e => {
  if (e.target===modalOverlay) modalOverlay.classList.remove('active');
});

// ═══ Init ════════════════════════════════════════════════════
(async function init() {
  let promptName = 'techniques';
  try {
    const resp = await fetch('/api/config');
    if (resp.ok) {
      const cfg = await resp.json();
      if (cfg.prompt) {
        promptName = cfg.prompt;
      }
    }
  } catch(e) {}
  await loadTechniques(promptName);

  const hasChat = loadChatHistory();
  const hasNotes = loadNotesData();

  if (!hasNotes) { initTracks(); }
  if (!hasChat) {
    messages = [{role:'system',content:buildSystemPrompt()}];
  }

  const promptDisplayName = promptName.replace(/-/g, ' ');
  
  if (!hasChat && !hasNotes) {
    chatAppend('st', '🎹  欢迎使用 AI Piano Roll！');
    chatAppend('st', '');
    chatAppend('st', '在下方输入框告诉 AI 你想创作什么音乐，例如：');
    chatAppend('st', '  · "写一段 C 大调的流行旋律"');
    chatAppend('st', '  · "创作 Am 小调的爵士和弦进行"');
    chatAppend('st', '  · "来一段 12 小节布鲁斯"');
    chatAppend('st', '');
    chatAppend('st', '也可点击左侧网格手动添加音符（左键添加/切换，右键删除）。');
    chatAppend('st', '—————————');
    chatAppend('st', `🎵 当前使用「${promptDisplayName}」创作指南`);
    chatAppend('st', '💡 音效包提示：将音频文件放入 /vocal/ 目录');
    chatAppend('st', '   支持格式：WAV、MP3、OGG、M4A、AAC、FLAC');
  } else {
    chatAppend('st', '📋 已恢复上次会话');
    chatAppend('st', `🎵 当前使用「${promptDisplayName}」创作指南`);
  }

  $('btn-save').addEventListener('click', handleManualSave);
  $('btn-clear-saved').addEventListener('click', clearSavedData);
  $('btn-export-text').addEventListener('click', exportNotesText);
  $('btn-export-json').addEventListener('click', exportNotesJson);
  $('import-file').addEventListener('change', importNotesJson);

  startAutoSave();

  window.addEventListener('beforeunload', () => {
    saveChatHistory();
    saveNotesData();
  });

  paintAll();
  updateStatus();
  updateKeyDisplay();
  updateTrackUI();
  loadSoundPack();
})();

// ═══ AMR Terminal ═════════════════════════════════════════════
const termOverlay = $('term-overlay');
const termOutput = $('term-output');
const termInput = $('term-input');
const termClose = $('term-close');
const termStatus = $('term-status');
let termOpen = false;

function termPrint(cls, text) {
  const div = document.createElement('div');
  div.className = cls || '';
  div.textContent = text;
  termOutput.appendChild(div);
  termOutput.scrollTop = termOutput.scrollHeight;
}

function termHTML(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  termOutput.appendChild(div);
  termOutput.scrollTop = termOutput.scrollHeight;
}

function openTerminal() {
  if (termOpen) return;
  termOpen = true;
  termOverlay.classList.add('active');
  termInput.value = '';
  termInput.focus();
  termStatus.textContent = 'AMR Terminal 就绪';
  if (!termOutput.textContent) {
    termPrint('info', 'AMR Terminal v1.0 — 输入 amr help 查看命令');
    termPrint('', '');
  }
}

function closeTerminal() {
  termOpen = false;
  termOverlay.classList.remove('active');
}

async function execTermCmd(raw) {
  const cmd = raw.trim();
  if (!cmd) return;
  termPrint('cmd', '> ' + cmd);
  termStatus.textContent = '执行中…';

  try {
    if (cmd === 'clear' || cmd === 'cls') {
      termOutput.innerHTML = '';
      termStatus.textContent = 'AMR Terminal 就绪';
    }
    else if (cmd === 'help' || cmd === 'amr help' || cmd === '?') {
      termPrint('info', '可用命令:');
      termPrint('', '  amr state     — 查看服务运行状态、内存、MIDI 服务');
      termPrint('', '  amr terminal  — 查看服务器最近日志');
      termPrint('', '  amr api       — 查看所有 API 接口');
      termPrint('', '  clear / cls   — 清屏');
      termPrint('', '  help          — 帮助');
      termStatus.textContent = '就绪';
    }
    else if (cmd === 'amr state') {
      const resp = await fetch('/api/state');
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      termPrint('info', '═'.repeat(40));
      termPrint('info', '  Server');
      termPrint('',     `    Status:    ${data.server.status}`);
      termPrint('',     `    Uptime:    ${data.server.uptime}`);
      termPrint('',     `    Port:      ${data.server.port}`);
      termPrint('',     `    Node:      ${data.server.node}`);
      termPrint('',     `    Platform:  ${data.server.platform} (${data.server.arch})`);
      termPrint('info', '  Memory');
      termPrint('',     `    RSS:       ${data.memory.rss}`);
      termPrint('',     `    HeapUsed:  ${data.memory.heapUsed} / ${data.memory.heapTotal}`);
      termPrint('info', '  MIDI Service');
      termPrint('',     `    Status:    ${data.midi.status} (${data.midi.generator})`);
      termPrint('info', '  Config');
      termPrint('',     `    Provider:  ${data.config.provider || '—'}`);
      termPrint('',     `    Model:     ${data.config.model || '—'}`);
      termPrint('',     `    Logs:      ${data.logs}`);
      termStatus.textContent = '状态检查完成';
    }
    else if (cmd === 'amr terminal') {
      const resp = await fetch('/api/terminal?n=30');
      const logs = await resp.json();
      if (!resp.ok) throw new Error(logs.error);
      for (const l of logs) {
        const time = l.time.slice(11, 19);
        const cls = l.level === 'error' ? 'err' : l.level === 'info' ? 'info' : 'time';
        termPrint(cls, `[${time}] ${l.msg}`);
      }
      if (logs.length === 0) termPrint('', '(无日志)');
      termStatus.textContent = `${logs.length} 条日志`;
    }
    else if (cmd === 'amr api') {
      const resp = await fetch('/api/api');
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      termPrint('info', `API 接口列表 (${data.endpoints.length}):`);
      termPrint('info', '═'.repeat(60));
      for (const ep of data.endpoints) {
        const streamTag = ep.stream ? ' 🔄' : '';
        const bodyTag = ep.body ? ` (body:${ep.body})` : '';
        termPrint('',  `  ${ep.method.padEnd(6)} ${ep.path.padEnd(18)} ${ep.desc}${streamTag}${bodyTag}`);
      }
      termStatus.textContent = `${data.endpoints.length} 个接口`;
    }
    else {
      termPrint('err', `未知命令: ${cmd}，输入 help 查看帮助`);
      termStatus.textContent = '命令未识别';
    }
  } catch(e) {
    termPrint('err', '错误: ' + e.message);
    termStatus.textContent = '错误';
  }
}

termInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    execTermCmd(termInput.value);
    termInput.value = '';
  }
  if (e.key === 'Escape') closeTerminal();
});

termClose.addEventListener('click', closeTerminal);

document.addEventListener('keydown', e => {
  if ((e.key === '`' || e.key === '~') && !e.ctrlKey && !e.metaKey) {
    const tag = document.activeElement?.tagName;
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;
    if (!isInput || document.activeElement === termInput) {
      e.preventDefault();
      if (termOpen) closeTerminal(); else openTerminal();
      return;
    }
  }
  if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); return; }
  if (e.key === 'Delete' && !playing) {
    if (notes.length && confirm('删除「'+tracks[currentTrackIdx].name+'」音轨所有音符？')) { pushHistory(); tracks[currentTrackIdx].notes=[]; notes=[]; paintAll(); updateStatus(); }
  }
});
