#!/usr/bin/env python3
"""
MIDI Generator — pure Python, zero dependencies.
Generates Type-0 MIDI files from JSON input.

Input (stdin): JSON { "notes": [...], "bpm": 120 }
Output (stdout): raw .mid file bytes
"""

import sys
import json
import struct
from typing import List, Dict, Tuple, Any

TPQN = 480


def encode_var_len(value: int) -> bytes:
    """Encode a non-negative integer as MIDI variable-length quantity."""
    value = max(0, value)
    parts = bytearray()
    parts.append(value & 0x7F)
    value >>= 7
    while value:
        parts.append((value & 0x7F) | 0x80)
        value >>= 7
    return bytes(reversed(parts))


def build_track(notes: List[Dict[str, Any]], bpm: int) -> bytes:
    """Build a single MIDI track chunk (Type-0)."""

    us_per_quarter = int(60_000_000 / bpm)
    events: List[Tuple[int, bytes]] = []

    # 1 — Track name (meta event)
    name = b"AI Piano Roll"
    events.append((0, b"\xff\x03" + struct.pack("B", len(name)) + name))

    # 2 — Tempo (meta event)
    tempo_bytes = struct.pack(">I", us_per_quarter)[1:]  # 3 bytes big-endian
    events.append((0, b"\xff\x51\x03" + tempo_bytes))

    # 3 — Program change (channel 0: Acoustic Grand Piano)
    events.append((0, b"\xc0\x00"))

    # 4 — Note events
    raw_note_events: List[Tuple[int, str, int, int]] = []
    for n in notes:
        pitch = max(0, min(127, int(round(n.get("pitch", 60)))))
        start  = float(n.get("start_beat", 0))
        dur    = float(n.get("duration", 1))
        vel    = max(1, min(127, int(n.get("velocity", 100))))

        tick_on  = int(round(start * TPQN))
        dur_tick = int(round(dur * TPQN))
        if dur_tick <= 0:
            dur_tick = int(round(0.25 * TPQN))

        raw_note_events.append((tick_on, "on", pitch, vel))
        raw_note_events.append((tick_on + dur_tick, "off", pitch, 0))

    # sort: tick ascending, note‑off before note‑on at the same tick
    raw_note_events.sort(key=lambda x: (x[0], 0 if x[1] == "off" else 1))

    for abs_tick, typ, pitch, vel in raw_note_events:
        status = 0x90 if typ == "on" else 0x80
        events.append((abs_tick, struct.pack("BBB", status, pitch, vel)))

    # Sort ALL events by absolute tick
    events.sort(key=lambda x: x[0])

    # 5 — End of track
    last_tick = events[-1][0] if events else 0
    events.append((last_tick, b"\xff\x2f\x00"))

    # ---------------  delta encoding  ---------------
    track_body = bytearray()
    cursor = 0
    for abs_tick, data in events:
        delta = abs_tick - cursor
        cursor = abs_tick
        track_body.extend(encode_var_len(delta))
        track_body.extend(data)

    return struct.pack(">4sI", b"MTrk", len(track_body)) + bytes(track_body)


def build_midi(notes: List[Dict[str, Any]], bpm: int) -> bytes:
    """Generate a complete Type-0 Standard MIDI File."""
    track = build_track(notes, bpm)
    header = struct.pack(">4sIHHH", b"MThd", 6, 0, 1, TPQN)
    return header + track


def main() -> None:
    try:
        raw = sys.stdin.buffer.read()
        payload = json.loads(raw)
    except Exception as exc:
        sys.stderr.write(f"Input parse error: {exc}\n")
        sys.exit(1)

    notes = payload.get("notes", [])
    bpm = int(payload.get("bpm", 120))
    midi_data = build_midi(notes, bpm)
    sys.stdout.buffer.write(midi_data)


if __name__ == "__main__":
    main()
