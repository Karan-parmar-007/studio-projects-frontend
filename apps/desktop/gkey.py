"""Cross-platform global hotkeys and chord capture via pynput.

Used on macOS and Linux (Windows keeps its native ctypes path in flow.py). Every
entry point is guarded by the caller: if pynput is missing or the OS denies the
global listener (e.g. macOS Accessibility not granted), the app still works through
the Record button in the window.
"""

from __future__ import annotations

import threading

from hotkeys import chord_matches, normalize, vk_from_char

_F_KEYS = {f"f{n}": 0x6F + n for n in range(1, 13)}  # f1 -> 0x70 ... f12 -> 0x7B


def _mod_of(key) -> str | None:
    name = getattr(key, "name", "") or ""
    if name.startswith("ctrl"):
        return "ctrl"
    if name.startswith("alt") or name == "alt_gr":
        return "alt"
    if name.startswith("shift"):
        return "shift"
    if name.startswith("cmd") or name.startswith("super") or name.startswith("win"):
        return "win"
    return None


def _vk_of(key) -> int:
    """Windows-style vk for a pynput key, or 0 if unsupported."""
    char = getattr(key, "char", None)
    if char:
        return vk_from_char(char)
    name = getattr(key, "name", "") or ""
    if name == "space":
        return 0x20
    return _F_KEYS.get(name, 0)


class HotkeyWatcher:
    def __init__(self, on_record, on_stop) -> None:
        self._on_record = on_record
        self._on_stop = on_stop
        self._mods: set[str] = set()
        self._listener = None
        self.record: dict | None = None
        self.stop: dict | None = None

    def set_chords(self, record: dict | None, stop: dict | None) -> None:
        self.record = record
        self.stop = stop

    def start(self) -> None:
        from pynput import keyboard

        self._listener = keyboard.Listener(on_press=self._press, on_release=self._release)
        self._listener.daemon = True
        self._listener.start()

    def stop_listening(self) -> None:
        if self._listener is not None:
            self._listener.stop()
            self._listener = None

    def _press(self, key) -> None:
        mod = _mod_of(key)
        if mod:
            self._mods.add(mod)
            return
        vk = _vk_of(key)
        if not vk:
            return
        separate_stop = self.stop and self.record and self.stop != self.record
        if separate_stop and chord_matches(self.stop, self._mods, vk):
            self._on_stop()
        elif chord_matches(self.record, self._mods, vk):
            self._on_record()

    def _release(self, key) -> None:
        mod = _mod_of(key)
        if mod:
            self._mods.discard(mod)


def capture(timeout: float = 8.0) -> dict | None:
    """Block until the user presses a modifier(s) + key, return a chord dict."""
    from pynput import keyboard

    mods: set[str] = set()
    result: dict = {}
    done = threading.Event()

    def press(key):
        mod = _mod_of(key)
        if mod:
            mods.add(mod)
            return None
        vk = _vk_of(key)
        if not vk:
            return None
        result["chord"] = normalize(sorted(mods), vk)
        done.set()
        return False  # stop the listener

    def release(key):
        mod = _mod_of(key)
        if mod:
            mods.discard(mod)
        return None

    listener = keyboard.Listener(on_press=press, on_release=release)
    listener.start()
    done.wait(timeout)
    listener.stop()
    return result.get("chord")
