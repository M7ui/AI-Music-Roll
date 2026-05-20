const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
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

const SYSTEM_PROMPT_BASE = `You are a professional music composition AI assistant embedded in a piano-roll editor. Help users create melodies, chord progressions, bass lines and arrangements by calling tools. You MUST respond in Chinese unless the user writes in another language.

PIANO ROLL SPECS: MIDI note range displayed: 36 (C2) – 96 (C7). Recommended melodic range: 48–84. Time is measured in beats (quarter-notes). Grid resolution: 0.25 beat (16th note). Default tempo 120 BPM, time-signature 4/4, velocity 100 (range 1-127).

TOOLS (always prefer add_notes for batches):
add_note(pitch, start_beat, duration, velocity=100) — pitch 36-96, start_beat float, duration 0.25/0.5/1/2/4
add_notes(notes) — batch: [{pitch, start_beat, duration, velocity?}, …]
remove_note(pitch, start_beat) — delete a note by pitch & exact start_beat
update_note(pitch, start_beat, new_pitch?, new_start_beat?, new_duration?, new_velocity?) — modify existing note
clear_all() — remove everything
get_notes() — returns current note list [{pitch, start_beat, duration, velocity}, …]
get_state() — returns {bpm, key:{root, scale, name}, time_signature:{num,den}, note_count}
set_tempo(bpm) — 40-300
set_key(root_note, scale_type) — root_note: MIDI num; scale_type: major|minor|pentatonic_major|pentatonic_minor|blues|dorian|mixolydian
set_time_signature(numerator, denominator)

NOTE → MIDI QUICK REF: C4=60 (middle C). Each octave +12. C=0 C#=1 D=2 D#=3 E=4 F=5 F#=6 G=7 G#=8 A=9 A#=10 B=11. C2=36 C3=48 D3=50 E3=52 F3=53 G3=55 A3=57 B3=59. C4=60 D4=62 E4=64 F4=65 G4=67 A4=69 B4=71. C5=72 D5=74 E5=76 F5=77 G5=79 A5=81 B5=83. C6=84 D6=86 E6=88 F6=89 G6=91 A6=93 B6=95. C7=96.

═══════════════════════════════════════
CRITICAL COMPOSITION RULES — OBEY STRICTLY
═══════════════════════════════════════

🔴 RULE 0 — STOP MAKING SIN-WAVE MELODIES (MOST IMPORTANT)
This is the #1 mistake. NEVER create melodies that walk stepwise up a scale and back down:
  ❌ C4 D4 E4 F4 G4 F4 E4 D4 C4 — this is a SCALE EXERCISE, not a melody
  ❌ E4 F#4 G#4 A4 B4 A4 G#4 F#4 E4 — same sin-wave, different key
  ❌ G4 A4 B4 C5 D5 C5 B4 A4 G4 — STILL the exact same pattern!
A real melody uses MOTIFS, leaps, and rhythmic variation — NOT mathematical functions.

🔴 RULE 0.5 — BUILD MELODY FROM A MOTIF (mandatory approach)
Step 1: Invent a MOTIF — a short 2-5 note idea with distinct rhythm. Examples:
  "E4 · G4 · C5 ··" (rising arpeggio, off-beat, big leap + silence = dramatic)
  "G4 ·· E4 C4 ·" (descending, syncopated rhythm, space between notes)
  "C4 D4 E4 G4 ··" (pentatonic run that stops BEFORE the octave)
  "A3 · C4 · E4 ·" (sparse, wide intervals, bluesy)
Step 2: REPEAT the motif exactly (builds familiarity)
Step 3: TRANSPOSE the motif up/down by a 3rd, 4th, or 5th (keeps it fresh)
Step 4: VARY the motif — change rhythm, add/remove a note, extend the ending
Step 5: RESOLVE to tonic with a contrasting final gesture
A 16-bar melody = motif × 4 variations, NOT a continuous up-down wave.

🔴 RULE 1 — RESTS & NEGATIVE SPACE
NEVER connect all notes back-to-back. Silence defines phrasing.
- After every 1-2 beats of melody, insert 0.25-0.5 beat of silence
- Gap of 0.5-1.0 beat between main phrases
- If you have a note ending at beat 2.0, the next should start at 2.25 or later

🔴 RULE 2 — RHYTHMIC VARIETY (anti-robotic)
Every 4-bar section MUST use at least 3 different durations from {0.25, 0.5, 0.75, 1.0, 1.5, 2.0}.
NEVER all quarter notes (♩♩♩♩). NEVER start every note on the beat (0.0, 1.0, 2.0).
Mix on-beat with off-beat (0.5, 1.5, 2.5). Syncopation = long note starts on weak beat, holds through strong beat.
Good: 0.25 0.25 0.5 [REST] 1.0 0.5 0.25 0.25

🔴 RULE 3 — VELOCITY DYNAMICS (expression)
Velocity 1-127. NEVER flat velocity across a phrase.
- Strong beats: 90-110, weak beats/passing: 60-80, accent peaks: 110-127
- Each phrase MUST have a dynamic arc — crescendo (60→75→90→105) or decrescendo

🔴 RULE 4 — CHORD-TONE PLACEMENT
Strong beats (1, 3 in 4/4) MUST feature chord tones (root/3rd/5th/7th of current scale).
Non-chord tones (2nd, 4th, 6th) are passing notes on weak beats / off-beats ONLY.
Use get_state() to check the current key. Notes outside the scale will be AUTO-CORRECTED by the system — check the returned "analysis" field to see what was fixed and learn from it.

🔴 RULE 5 — LEAP + STEP MIX (avoids the wave trap)
Pure stepwise = scale exercise. Pure leaps = disconnected.
RULE: After a leap of 3rd or larger, resolve by step in the OPPOSITE direction.
Good: C4↑E4↑G4↓F4↓E4 (leap up, then step down) — creates interest + resolution
Good: G4↓E4↓C4↑D4↑E4 (leap down, then step up)
Bad:  C4↑D4↑E4↑F4↑G4 (pure scale = robotic wave)

🔴 RULE 6 — INTERVAL SAFETY
Mostly use: 2nd, 3rd, 4th, 5th. Sparingly: 6th, octave.
AVOID in melody: minor 2nd (1 semitone = harsh), tritone (6 semitones), major 7th (11 semitones).
The system detects and reports dissonant overlaps — check the analysis and adjust.

🔴 RULE 7 — STYLE-SPECIFIC
Ballad: slow, notes 1.0-2.0, expressive leaps, lots of silence, vel 60-90
Pop: moderate, hook-driven, mix step+leap, vel 70-100, 0.25-0.5 rests
EDM: tight, rhythmic, lots of 0.25 notes on off-beats, vel 80-110
Jazz: syncopated, swing (0.75), chromatic passing notes, vel varied

🔴 RULE 8 — PRE-GENERATION WORKFLOW (do BEFORE calling add_notes)
1. Always call get_state() FIRST to know the current key/BPM
2. Call get_notes() to see existing notes and avoid collisions
3. Plan your MOTIF first before generating a single note
4. When editing → use update_note(), never delete+re-add

Before generating ANY notes, answer these 5 questions in your reasoning:
1. "What is my MOTIF?" (specific notes + rhythm)
2. "How will I develop it?" (repeat → transpose → vary → resolve)
3. "Where are my rests?" (breathing points every 1-2 beats)
4. "What is the velocity shape?" (dynamic arc per phrase)
5. "Am I avoiding the sin-wave trap?" (leaps + steps mixed, not straight up-down)

Always explain what you wrote and the musical reasoning in Chinese.`;

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
  {type:"function",function:{name:"add_note",description:"Add a single note. System auto-corrects notes outside the current scale.",
    parameters:{type:"object",properties:{
      pitch:{type:"integer",description:"MIDI 36-96"},
      start_beat:{type:"number",description:"Start beat (0-based, 0.25 increments)"},
      duration:{type:"number",description:"0.25/0.5/1/2/4 beats"},
      velocity:{type:"integer",description:"1-127, default 100"}},
      required:["pitch","start_beat","duration"]}}},
  {type:"function",function:{name:"add_notes",description:"Batch-add notes. System auto-corrects out-of-scale notes and reports dissonances. Prefer this over add_note for batches.",
    parameters:{type:"object",properties:{notes:{type:"array",
      items:{type:"object",properties:{
        pitch:{type:"integer"},start_beat:{type:"number"},
        duration:{type:"number"},velocity:{type:"integer"}},
        required:["pitch","start_beat","duration"]}}},
      required:["notes"]}}},
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
];

let notes = [];
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
      notes: notes, bpm: bpm, key: currentKey,
      timeSignature: currentTimeSignature, timestamp: Date.now()
    }));
  } catch(e) { console.warn('保存音符失败:', e); }
}

function loadNotesData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_NOTES);
    if (stored) {
      const data = JSON.parse(stored);
      if (Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000) {
        notes = data.notes;
        bpm = data.bpm || 120;
        bpmInp.value = bpm;
        currentKey = data.key || { root: 60, scale: 'major' };
        currentTimeSignature = data.timeSignature || { num: 4, den: 4 };
        paintAll();
        updateStatus();
        updateKeyDisplay();
        return true;
      }
    }
  } catch(e) { console.warn('加载音符失败:', e); }
  return false;
}

let saveTimer = null;
function startAutoSave() {
  saveTimer = setInterval(() => {
    if (messages.length > 1) saveChatHistory();
    if (notes.length > 0) saveNotesData();
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
  notes = [];
  chatMsgs.innerHTML = '';
  paintAll();
  updateStatus();
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

  for (const n of notes) {
    const p = n.pitch;
    if (p < MIN_P || p >= MAX_P) continue;
    const x1 = n.start_beat * SUBDIV * CELL_W;
    const y1 = HDR_H + (MAX_P-1-p) * CELL_H;
    const x2 = x1 + n.duration * SUBDIV * CELL_W;
    const y2 = y1 + CELL_H - 1;
    const t = (n.velocity||DEF_VEL)/127;
    const grayLevel = Math.floor(120 + 135 * t);
    const isDraggingNote = isDragging && dragNote && n.pitch === dragNote.pitch && Math.abs(n.start_beat - dragNote.start_beat) < 0.001;
    const isResizingNote = isResizing && resizeNote && n.pitch === resizeNote.pitch && Math.abs(n.start_beat - resizeNote.start_beat) < 0.001;
    if (isDraggingNote) {
      gctx.fillStyle = '#ffffff';
      gctx.strokeStyle = '#aaaaaa';
    } else if (isResizingNote) {
      gctx.fillStyle = `rgb(${grayLevel},${grayLevel},${grayLevel})`;
      gctx.strokeStyle = '#888888';
    } else {
      gctx.fillStyle = `rgb(${grayLevel},${grayLevel},${grayLevel})`;
      gctx.strokeStyle = '#666666';
    }
    gctx.fillRect(x1+1,y1+1,x2-x1-2,y2-y1-1);
    gctx.strokeRect(x1+1,y1+1,x2-x1-2,y2-y1-1);
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
  return notes.find(n => n.pitch===pitch && beat>=n.start_beat && beat<n.start_beat+n.duration);
}

function findAtRightEdge(pitch, beat, px, cellW) {
  const threshold = Math.max(4, cellW * 0.4);
  for (const n of notes) {
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
  notes = notes.filter(n => !(n.pitch===pitch && Math.abs(n.start_beat-start)<0.001));
  notes.push({pitch, start_beat:start, duration:dur, velocity:vel||velDefault});
}

function rmNote(pitch, start) {
  pushHistory();
  notes = notes.filter(n => !(n.pitch===pitch && Math.abs(n.start_beat-start)<0.001));
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
  statusEl.textContent = `Notes: ${notes.length}  |  BPM: ${bpm}  |  小节: ${bars}  |  音效: ${soundPackName || '默认音色'}`;
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
  notes = notesHistory.pop();
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
  const listEl = $('notes-list');
  if (!listEl) return;
  if (notes.length === 0) {
    listEl.innerHTML = '<div style="color:#444;padding:8px">暂无音符</div>';
    updateNotesTitle();
    return;
  }
  const sorted = [...notes].sort((a, b) => {
    if (a.start_beat !== b.start_beat) return a.start_beat - b.start_beat;
    return b.pitch - a.pitch;
  });
  let html = '';
  for (const n of sorted) {
    const noteName = NOTE_NAMES[n.pitch % 12] + (Math.floor(n.pitch / 12) - 1);
    const vel = n.velocity || DEF_VEL;
    html += '<div style="padding:3px 6px;border-bottom:1px solid #111130;display:flex;justify-content:space-between">' +
      '<span style="color:#00d4aa">' + noteName + '</span>' +
      '<span style="color:#666">' + n.start_beat.toFixed(2) + '</span>' +
      '<span style="color:#7c6cf7">' + n.duration.toFixed(2) + '</span>' +
      '<span style="color:#ff9966">' + vel + '</span>' +
      '</div>';
  }
  listEl.innerHTML = html;
  updateNotesTitle();
}

function updateNotesTitle() {
  const titleEl = $('notes-title');
  if (titleEl) {
    titleEl.innerHTML = '🎼 音符列表 <span style="float:right;color:#666;font-weight:normal">共 ' + notes.length + ' 个</span>';
  }
}

function exportNotesText() {
  if (notes.length === 0) { alert('没有音符可导出'); return; }
  let text = 'AI Piano Roll - 音符导出\n================================\n\n';
  text += '基本信息:\n';
  text += '  BPM: ' + bpm + '\n';
  text += '  调式: ' + NOTE_NAMES[currentKey.root % 12] + ' ' + currentKey.scale + '\n';
  text += '  拍号: ' + currentTimeSignature.num + '/' + currentTimeSignature.den + '\n';
  text += '  音符数量: ' + notes.length + '\n\n';
  text += '音符列表:\n--------------------------------\n';
  text += '音高\t起始拍\t时值\t力度\n';
  const sorted = [...notes].sort((a, b) => {
    if (a.start_beat !== b.start_beat) return a.start_beat - b.start_beat;
    return b.pitch - a.pitch;
  });
  for (const n of sorted) {
    const noteName = NOTE_NAMES[n.pitch % 12] + (Math.floor(n.pitch / 12) - 1);
    text += noteName + '\t' + n.start_beat.toFixed(2) + '\t' + n.duration.toFixed(2) + '\t' + (n.velocity || DEF_VEL) + '\n';
  }
  const blob = new Blob([text], {type: 'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ai-piano-roll-notes-' + new Date().toISOString().split('T')[0] + '.txt';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  statusEl.textContent = '✓ 音符已导出为文本';
  setTimeout(() => updateStatus(), 2000);
}

function exportNotesJson() {
  if (notes.length === 0) { alert('没有音符可导出'); return; }
  const data = {
    version: '1.0',
    exportTime: new Date().toISOString(),
    bpm: bpm,
    key: currentKey,
    timeSignature: currentTimeSignature,
    notes: notes
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ai-piano-roll-' + new Date().toISOString().split('T')[0] + '.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  statusEl.textContent = '✓ 音符已导出为 JSON';
  setTimeout(() => updateStatus(), 2000);
}

function importNotesJson(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.notes) {
        pushHistory();
        notes = data.notes;
        if (data.bpm) { bpm = data.bpm; bpmInp.value = bpm; }
        if (data.key) currentKey = data.key;
        if (data.timeSignature) currentTimeSignature = data.timeSignature;
        paintAll();
        updateStatus();
        updateKeyDisplay();
        statusEl.textContent = '✓ 已导入音符';
      }
    } catch(err) { alert('导入失败: ' + err.message); }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ═══ MIDI Download ════════════════════════════════════════════
async function downloadMidi() {
  if (!notes.length) { alert('没有音符可导出'); return; }
  try {
    const resp = await fetch('/api/midi', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ notes, bpm })
    });
    if (!resp.ok) {
      const e = await resp.json().catch(()=>({}));
      throw new Error(e.error||`HTTP ${resp.status}`);
    }
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ai-piano-roll.mid';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    statusEl.textContent = 'MIDI 已导出';
  } catch(e) {
    alert('MIDI 导出失败: ' + e.message);
  }
}

$('btn-midi').addEventListener('click', downloadMidi);

// ═══ Playback ═════════════════════════════════════════════════
$('btn-play').addEventListener('click', () => {
  if (playing) return;
  ensureAudio();
  bpm = parseInt(bpmInp.value)||120;
  playing = true;
  playStart = audioCtx.currentTime;
  const spb = 60/bpm;
  for (const n of notes) {
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
  if (!notes.length || !confirm('清除所有音符？')) return;
  pushHistory();
  notes = []; paintAll(); updateStatus();
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
  chatAppend('st', '🎹  新对话已开始');
  chatAppend('st', '—————————');
  statusEl.textContent = '新对话已就绪';
});

// ═══ Tool Execution ══════════════════════════════════════════
function execTool(name, args) {
  try {
    switch(name) {
    case 'add_note': {
      let p=args.pitch, s=args.start_beat, d=args.duration, v=args.velocity;
      const analysis = analyzeNewNotes([{pitch:p, start_beat:s, duration:d, velocity:v}], notes);
      if (analysis.violations.length > 0) {
        p = analysis.violations[0].corrected;
      }
      addNote(p,s,d,v); paintAll();
      const result = {ok:true, note:NOTE_NAMES[p%12]+(Math.floor(p/12)-1), beat:s, dur:d};
      if (analysis.violations.length > 0) {
        result.warning = '音高已自动修正: 原始 ' + analysis.violations[0].original + ' → ' + p + ' (不在' + NOTE_NAMES[currentKey.root%12] + ' ' + currentKey.scale + '音阶内)';
      }
      if (analysis.dissonances.length > 0) {
        result.dissonances = analysis.dissonances;
      }
      return result;
    }
    case 'add_notes': {
      const analysis = analyzeNewNotes(args.notes, notes);
      pushHistory();
      let c=0;
      for (const nt of args.notes) {
        _addNoteRaw(nt.pitch, nt.start_beat, nt.duration, nt.velocity); c++;
      }
      paintAll();
      const result = {ok:true, count:c};
      if (analysis.violations.length > 0 || analysis.dissonances.length > 0) {
        result.analysis = {
          out_of_scale: analysis.violations.length,
          corrected: analysis.violations.map(function(v) { return {original: v.original, fixed_to: v.corrected, beat: v.beat}; }),
          dissonant_pairs: analysis.dissonances.length > 0 ? analysis.dissonances.slice(0, 8) : [],
          dissonant_count: analysis.dissonances.length,
        };
        if (analysis.violations.length > 0) {
          result.analysis.summary = analysis.violations.length + '个音符不在' + NOTE_NAMES[currentKey.root%12] + ' ' + currentKey.scale + '音阶内，已自动修正';
        }
      }
      return result;
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
      notes=[]; paintAll(); return {ok:true};
    case 'get_notes':
      return {notes, count:notes.length};
    case 'get_state':
      return {
        bpm, tempo:bpm,
        key:{root:currentKey.root, scale:currentKey.scale, name:NOTE_NAMES[currentKey.root%12]+' '+currentKey.scale},
        time_signature:{numerator:currentTimeSignature.num, denominator:currentTimeSignature.den},
        note_count:notes.length
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
    if (notes.length && confirm('删除所有音符？')) { pushHistory(); notes = []; paintAll(); updateStatus(); }
  }
});
