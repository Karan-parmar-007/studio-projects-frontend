"""Chunks end on a pause, never in the middle of a word."""

import math
import struct

from flowlib import quiet_cut

RATE = 16000


def tone(seconds: float, amp: int = 8000) -> bytes:
    n = int(RATE * seconds)
    return b"".join(struct.pack("<h", int(amp * math.sin(2 * math.pi * 300 * i / RATE))) for i in range(n))


def silence(seconds: float) -> bytes:
    return b"\x00\x00" * int(RATE * seconds)


def test_cuts_inside_the_pause():
    pcm = tone(17.5) + silence(0.6) + tone(2.0)  # speech, a pause, more speech: 20.1 s
    cut = quiet_cut(pcm, RATE, 0, len(pcm))
    pause_start = int(RATE * 17.5) * 2
    pause_end = pause_start + int(RATE * 0.6) * 2
    assert pause_start <= cut <= pause_end
    assert cut % 2 == 0


def test_only_looks_in_the_last_seconds():
    pcm = silence(1.0) + tone(19.0)  # the only pause is far back
    cut = quiet_cut(pcm, RATE, 0, len(pcm), search_seconds=4.0)
    assert cut >= len(pcm) - int(RATE * 4.0) * 2


def test_short_audio_is_not_cut():
    pcm = tone(0.4)
    assert quiet_cut(pcm, RATE, 0, len(pcm)) == len(pcm)


def test_respects_the_start_offset():
    pcm = silence(2.0) + tone(10.0)
    start = int(RATE * 9.0) * 2
    cut = quiet_cut(pcm, RATE, start, len(pcm))
    assert start < cut <= len(pcm)
