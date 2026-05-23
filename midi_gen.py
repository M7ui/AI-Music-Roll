#!/usr/bin/env python3
"""
MIDI Generator — pure Python, zero dependencies.
Generates Type-1 (multi-track) MIDI files from JSON input.

Input (stdin): JSON { "tracks": [...], "bpm": 120 }
  or backward compat: { "notes": [...], "bpm": 120 }
Output (stdout): raw .mid file bytes
"""

import sys
import json
import struct
from typing import List, Dict, Tuple, Any, Optional

TPQN = 480

PROGRAM_NAMES = {
    0: "Acoustic Grand Piano",
    24: "Acoustic Guitar (nylon)",
    25: "Acoustic Guitar (steel)",
    32: "Acoustic Bass",
    33: "Electric Bass (finger)",
    48: "String Ensemble 1",
    49: "String Ensemble 2",
    80: "Lead 1 (square)",
    88: "Pad 2 (warm)",
    114: "Steel Drums",
}


def encode_var_len(value: int) -> bytes:
    value = max(0, value)
    parts = bytearray()
    parts.append(value & 0x7F)
    value >>= 7
    while value:
        parts.append((value & 0x7F) | 0x80)
        value >>= 7
    return bytes(reversed(parts))


def build_track_body(name: str, channel: int, program: int,
                     notes: List[Dict[str, Any]], bpm: int,
                     us_per_quarter: int) -> bytes:

    events: List[Tuple[int, bytes]] = []

    name_bytes = name.encode("utf-8", errors="replace")[:64]
    events.append((0, b"\xff\x03" + struct.pack("B", len(name_bytes)) + name_bytes))

    if program >= 0:
        events.append((0, struct.pack("BB", 0xC0 | channel, program)))

    raw_note_events: List[Tuple[int, str, int, int, int]] = []
    for n in notes:
        pitch = max(0, min(127, int(round(n.get("pitch", 60)))))
        start = float(n.get("start_beat", 0))
        dur = float(n.get("duration", 1))
        vel = max(1, min(127, int(n.get("velocity", 100))))

        tick_on = int(round(start * TPQN))
        dur_tick = int(round(dur * TPQN))
        if dur_tick <= 0:
            dur_tick = int(round(0.25 * TPQN))

        raw_note_events.append((tick_on, "on", channel, pitch, vel))
        raw_note_events.append((tick_on + dur_tick, "off", channel, pitch, 0))

    raw_note_events.sort(key=lambda x: (x[0], 0 if x[1] == "off" else 1))

    for abs_tick, typ, ch, pitch, vel in raw_note_events:
        status = (0x90 | ch) if typ == "on" else (0x80 | ch)
        if ch == 9:
            status = (0x99 if typ == "on" else 0x89)
        events.append((abs_tick, struct.pack("BBB", status, pitch, vel)))

    events.sort(key=lambda x: x[0])

    last_tick = events[-1][0] if events else 0
    events.append((last_tick, b"\xff\x2f\x00"))

    track_body = bytearray()
    cursor = 0
    for abs_tick, data in events:
        delta = abs_tick - cursor
        cursor = abs_tick
        track_body.extend(encode_var_len(delta))
        track_body.extend(data)

    return struct.pack(">4sI", b"MTrk", len(track_body)) + bytes(track_body)


def build_conductor_track(bpm: int, us_per_quarter: int) -> bytes:
    events: List[Tuple[int, bytes]] = []

    tempo_bytes = struct.pack(">I", us_per_quarter)[1:]
    events.append((0, b"\xff\x51\x03" + tempo_bytes))

    ts_num, ts_den = 4, 4
    den_byte = ts_den.bit_length() - 1
    events.append((0, b"\xff\x58\x04" + struct.pack("BBBB", ts_num, den_byte, 24, 8)))

    last_tick = events[-1][0] if events else 0
    events.append((last_tick, b"\xff\x2f\x00"))

    body = bytearray()
    cursor = 0
    for abs_tick, data in sorted(events, key=lambda x: x[0]):
        delta = abs_tick - cursor
        cursor = abs_tick
        body.extend(encode_var_len(delta))
        body.extend(data)

    return struct.pack(">4sI", b"MTrk", len(body)) + bytes(body)


def build_midi(tracks: List[Dict[str, Any]], bpm: int) -> bytes:
    us_per_quarter = int(60_000_000 / bpm)
    num_tracks = len(tracks)

    conductor = build_conductor_track(bpm, us_per_quarter)

    midi_tracks = []
    for t in tracks:
        name = t.get("name", "Track")
        channel = t.get("channel", 0)
        program = t.get("program", 0)
        notes = t.get("notes", [])
        midi_tracks.append(build_track_body(name, channel, program, notes, bpm, us_per_quarter))

    header = struct.pack(">4sIHHH", b"MThd", 6, 1, num_tracks + 1, TPQN)
    return header + conductor + b"".join(midi_tracks)


def main() -> None:
    try:
        raw = sys.stdin.buffer.read()
        payload = json.loads(raw)
    except Exception as exc:
        sys.stderr.write(f"Input parse error: {exc}\n")
        sys.exit(1)

    bpm = int(payload.get("bpm", 120))

    if "tracks" in payload and payload["tracks"]:
        tracks = payload["tracks"]
        for t in tracks:
            if "channel" not in t:
                t["channel"] = tracks.index(t)
            if "program" not in t:
                t["program"] = 0
            if "name" not in t:
                t["name"] = f"Track {tracks.index(t) + 1}"
            if "notes" not in t:
                t["notes"] = []
        midi_data = build_midi(tracks, bpm)
    elif "notes" in payload:
        tracks = [{"name": "Piano", "channel": 0, "program": 0, "notes": payload["notes"]}]
        midi_data = build_midi(tracks, bpm)
    else:
        sys.stderr.write("Error: no tracks or notes in input\n")
        sys.exit(1)

    sys.stdout.buffer.write(midi_data)


if __name__ == "__main__":
    main()
