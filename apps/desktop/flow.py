"""Studio Flow for Windows, macOS, and Linux.

Paste the API key from Studio, then choose the keys that record and stop.
The chosen keys paste the text into whatever you were typing.
Ctrl+Alt+S opens settings. Closing the window quits; minimise to keep it running.
"""

from __future__ import annotations

import json
import os
import sys
import threading
import time
import tkinter as tk
from pathlib import Path

from flowlib import format_text, transcribe
from hotkeys import mask, normalize, same
from record import Mic

# Every request goes to the Studio server; users only enter their API key.
# STUDIO_URL in the environment points a dev build elsewhere; it is never shown in the UI.
STUDIO = (os.environ.get("STUDIO_URL") or "https://studio.karanparmar.in").strip().rstrip("/")
MAX_SECONDS = 300
CHUNK_SECONDS = 20


def settings_path() -> Path:
    if sys.platform == "win32":
        base = Path(os.environ.get("APPDATA", str(Path.home())))
    else:
        base = Path.home() / ".config"
    path = base / "StudioFlow" / "settings.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _chord(value) -> dict | None:
    if not isinstance(value, dict):
        return None
    return normalize(list(value.get("mods") or []), int(value.get("vk") or 0))


def load_settings() -> dict:
    path = settings_path()
    data = {"api_key": "", "script": "roman", "record": None, "stop": None}
    if path.exists():
        stored = json.loads(path.read_text())
        data["api_key"] = stored.get("api_key") or ""
        data["script"] = stored.get("script") or "roman"
        data["record"] = _chord(stored.get("record"))
        data["stop"] = _chord(stored.get("stop"))
    return data


def save_settings(data: dict) -> None:
    settings_path().write_text(
        json.dumps(
            {
                "api_key": data.get("api_key", ""),
                "script": data.get("script", "roman"),
                "record": data.get("record"),
                "stop": data.get("stop"),
            },
            indent=2,
        )
    )


def _windows():
    import ctypes

    return ctypes.windll.user32, ctypes.windll.kernel32


_INSTANCE_HOLD = None  # keeps the mutex / lock file alive for the life of the process


def single_instance() -> bool:
    """True if this is the only Studio Flow running. A second copy would fail to
    register the global shortcuts ("already taken"), so it should not start."""
    global _INSTANCE_HOLD
    if sys.platform == "win32":
        import ctypes

        kernel32 = ctypes.windll.kernel32
        kernel32.SetLastError(0)
        _INSTANCE_HOLD = kernel32.CreateMutexW(None, False, "Local\\StudioFlow.SingleInstance")
        return kernel32.GetLastError() != 183  # ERROR_ALREADY_EXISTS
    import fcntl

    _INSTANCE_HOLD = open(settings_path().parent / "studioflow.lock", "w")
    try:
        fcntl.flock(_INSTANCE_HOLD, fcntl.LOCK_EX | fcntl.LOCK_NB)
        return True
    except OSError:
        return False


def copy_and_paste(text: str) -> None:
    if sys.platform == "win32":
        _win_clipboard(text)
        user32, _kernel32 = _windows()
        user32.keybd_event(0x11, 0, 0, 0)
        user32.keybd_event(0x56, 0, 0, 0)
        user32.keybd_event(0x56, 0, 2, 0)
        user32.keybd_event(0x11, 0, 2, 0)
        return
    if sys.platform == "darwin":
        import subprocess

        subprocess.run(["pbcopy"], input=text.encode(), check=False)
        subprocess.Popen(
            ["osascript", "-e", 'tell application "System Events" to keystroke "v" using command down']
        )
        return
    _linux_clipboard(text)
    import shutil
    import subprocess

    if shutil.which("wtype"):
        subprocess.Popen(["wtype", "-M", "ctrl", "v", "-m", "ctrl"])
        return
    if shutil.which("xdotool"):
        subprocess.Popen(["xdotool", "key", "--clearmodifiers", "ctrl+v"])


def _win_clipboard(text: str) -> None:
    import ctypes

    user32, kernel32 = _windows()
    user32.OpenClipboard.argtypes = [ctypes.c_void_p]
    user32.SetClipboardData.argtypes = [ctypes.c_uint, ctypes.c_void_p]
    kernel32.GlobalAlloc.restype = ctypes.c_void_p
    kernel32.GlobalLock.argtypes = [ctypes.c_void_p]
    kernel32.GlobalLock.restype = ctypes.c_void_p
    kernel32.GlobalUnlock.argtypes = [ctypes.c_void_p]
    if not user32.OpenClipboard(None):
        raise OSError("The clipboard did not open")
    try:
        user32.EmptyClipboard()
        raw = text.encode("utf-16-le") + b"\x00\x00"
        handle = kernel32.GlobalAlloc(0x0002, len(raw))
        locked = kernel32.GlobalLock(handle)
        ctypes.memmove(locked, raw, len(raw))
        kernel32.GlobalUnlock(handle)
        if not user32.SetClipboardData(13, handle):
            raise OSError("The clipboard did not take the text")
    finally:
        user32.CloseClipboard()


def _linux_clipboard(text: str) -> None:
    import shutil
    import subprocess

    if shutil.which("wl-copy"):
        subprocess.run(["wl-copy"], input=text.encode(), check=False)
        return
    if shutil.which("xclip"):
        subprocess.run(["xclip", "-selection", "clipboard"], input=text.encode(), check=False)
        return
    raise OSError("Install wl-copy or xclip so the text can be pasted")


class App:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.settings = load_settings()
        self.script = tk.StringVar(value=self.settings.get("script") or "roman")
        self.record = self.settings.get("record")
        self.stop = self.settings.get("stop")
        self.record_label = tk.StringVar(value=(self.record or {}).get("label") or "Not set")
        self.stop_label = tk.StringVar(value=(self.stop or {}).get("label") or "Not set")
        self.mic = Mic()
        self.mode = "idle"
        self.sent = 0
        self.parts: list[str] = []
        self.inflight = False
        self._stop_preview = threading.Event()
        self._hide_after = None
        self._reload = threading.Event()
        self._build_settings()
        self._build_toast()
        self.root.update_idletasks()
        if self.settings.get("api_key") and self.record:
            self.root.iconify()
        else:
            self.root.deiconify()
        self.watcher = None
        if sys.platform == "win32":
            threading.Thread(target=self._hotkey, daemon=True).start()
        else:
            self._start_watcher()

    def quit(self) -> None:
        """The window's close button: stop everything and exit. Use minimise to
        keep Studio Flow running in the background."""
        try:
            if self.mode == "recording":
                self.mic.stop()
        except Exception:
            pass
        if self.watcher is not None:
            try:
                self.watcher.stop_listening()
            except Exception:
                pass
        if sys.platform == "win32":
            try:
                user32, _kernel32 = _windows()
                for hotkey_id in (1, 2, 3):
                    user32.UnregisterHotKey(None, hotkey_id)
            except Exception:
                pass
        try:
            self.toast.destroy()
        except Exception:
            pass
        self.root.destroy()

    def _start_watcher(self) -> None:
        """macOS/Linux global hotkeys via pynput. Best effort: the Record button
        in the window always works even if this cannot bind."""
        try:
            from gkey import HotkeyWatcher
        except Exception:
            return
        try:
            self.watcher = HotkeyWatcher(
                on_record=lambda: self.root.after(0, self._record_hotkey),
                on_stop=lambda: self.root.after(0, self._finish),
            )
            self.watcher.set_chords(self.record, self.stop)
            self.watcher.start()
        except Exception:
            self.watcher = None

    def _build_settings(self) -> None:
        bg = "#0a192f"
        fg = "#ccd6f6"
        accent = "#64ffda"
        self.root.title("Studio Flow")
        self.root.configure(bg=bg)
        self.root.geometry("480x600")
        self.root.protocol("WM_DELETE_WINDOW", self.quit)
        tk.Label(self.root, text="Studio Flow", bg=bg, fg=accent, font=("Segoe UI", 18, "bold")).pack(anchor="w", padx=16, pady=(16, 4))
        tk.Label(
            self.root,
            text="Sign in to Studio, open APIs, and create a key. Paste it here, then choose the keys that record and stop.",
            bg=bg,
            fg=fg,
            wraplength=440,
            justify="left",
        ).pack(anchor="w", padx=16, pady=8)
        self.key_entry = tk.Entry(self.root, bg="#112240", fg=accent, relief="flat", font=("Consolas", 11))
        self.key_entry.insert(0, self.settings.get("api_key") or "")
        self.key_entry.pack(fill="x", padx=16, pady=8)
        self._chord_row("Record", self.record_label, "record")
        self._chord_row("Stop", self.stop_label, "stop")
        row = tk.Frame(self.root, bg=bg)
        row.pack(anchor="w", padx=16, pady=(12, 0))
        tk.Radiobutton(row, text="Roman Hinglish", variable=self.script, value="roman", bg=bg, fg=fg, selectcolor="#112240", activebackground=bg).pack(side="left")
        tk.Radiobutton(row, text="Devanagari", variable=self.script, value="devanagari", bg=bg, fg=fg, selectcolor="#112240", activebackground=bg).pack(side="left", padx=12)
        tk.Button(
            self.root,
            text="● Record / Stop",
            command=self.toggle,
            bg="#112240",
            fg=accent,
            relief="flat",
            padx=12,
            pady=8,
        ).pack(anchor="w", padx=16, pady=(14, 0))
        tk.Label(
            self.root,
            text="Click Record / Stop, or use your shortcut. On macOS, allow the app under System Settings, Privacy & Security, Accessibility and Microphone.",
            bg=bg,
            fg="#8892b0",
            wraplength=440,
            justify="left",
            font=("Segoe UI", 9),
        ).pack(anchor="w", padx=16, pady=(4, 0))
        tk.Button(self.root, text="Save", command=self._save, bg="#112240", fg=accent, relief="flat", padx=12, pady=8).pack(anchor="w", padx=16, pady=16)
        self.settings_status = tk.Label(self.root, text="", bg=bg, fg=accent, wraplength=440, justify="left", font=("Segoe UI", 10))
        self.settings_status.pack(anchor="w", padx=16)

    def _build_toast(self) -> None:
        self.toast = tk.Toplevel(self.root)
        self.toast.overrideredirect(True)
        self.toast.attributes("-topmost", True)
        self.toast.configure(bg="#0a192f")
        self.toast.geometry("360x64+40+40")
        self.status = tk.Label(self.toast, text="", bg="#0a192f", fg="#64ffda", wraplength=340, justify="left", font=("Segoe UI", 11))
        self.status.pack(fill="both", expand=True, padx=12, pady=10)
        self.toast.withdraw()
        self.root.after(200, self._noactivate)

    def _noactivate(self) -> None:
        if sys.platform != "win32":
            return
        user32, _kernel = _windows()
        hwnd = int(self.toast.winfo_id() or 0)
        if not hwnd:
            return
        style = user32.GetWindowLongW(hwnd, -20)
        user32.SetWindowLongW(hwnd, -20, style | 0x08000000 | 0x00000080)

    def _chord_row(self, title: str, variable: tk.StringVar, which: str) -> None:
        row = tk.Frame(self.root, bg="#0a192f")
        row.pack(fill="x", padx=16, pady=4)
        tk.Label(row, text=title, width=8, anchor="w", bg="#0a192f", fg="#8892b0", font=("Segoe UI", 10)).pack(side="left")
        tk.Label(row, textvariable=variable, bg="#0a192f", fg="#64ffda", font=("Segoe UI", 11)).pack(side="left", padx=8)
        tk.Button(
            row,
            text="Choose",
            command=lambda: self._capture(which),
            bg="#112240",
            fg="#64ffda",
            relief="flat",
            padx=10,
            pady=4,
        ).pack(side="right")

    def _capture(self, which: str) -> None:
        self.settings_status.configure(text="Press the keys. Include Ctrl, Alt, or Shift, or use a function key.")

        def read_chord():
            if sys.platform == "win32":
                return _read_chord()
            try:
                from gkey import capture
            except Exception:
                return None
            return capture()

        def work() -> None:
            chord = read_chord()

            def apply() -> None:
                if not chord:
                    self.settings_status.configure(text="Hold Ctrl, Alt, or Shift, then press the last key.")
                    return
                if which == "record":
                    self.record = chord
                    self.record_label.set(chord["label"])
                else:
                    self.stop = chord
                    self.stop_label.set(chord["label"])
                self.settings_status.configure(text=f"{which.capitalize()} is {chord['label']}. Save to use it.")

            self.root.after(0, apply)

        threading.Thread(target=work, daemon=True).start()

    def _studio(self) -> str:
        return STUDIO

    def _save(self) -> None:
        api_key = self.key_entry.get().strip()
        if not api_key:
            self.settings_status.configure(text="Paste the API key from Studio first.")
            return
        if not self.record:
            self.settings_status.configure(text="Choose the record keys.")
            return
        self.settings = {
            "api_key": api_key,
            "script": self.script.get(),
            "record": self.record,
            "stop": self.stop,
        }
        save_settings(self.settings)
        self._reload.set()
        if self.watcher is not None:
            self.watcher.set_chords(self.record, self.stop)
        if same(self.record, self.stop) or not self.stop:
            ready = f"Saved. {self.record['label']} records and stops."
        else:
            ready = f"Saved. {self.record['label']} records. {self.stop['label']} stops."
        self.settings_status.configure(text=ready)

    def set_status(self, text: str, hold: bool = False) -> None:
        def apply() -> None:
            self.status.configure(text=text)
            self._noactivate()
            self.toast.deiconify()
            self._place_toast()
            if self._hide_after is not None:
                self.root.after_cancel(self._hide_after)
                self._hide_after = None
            if not hold and self.mode == "idle":
                self._hide_after = self.root.after(2500, self.toast.withdraw)

        self.root.after(0, apply)

    def _place_toast(self) -> None:
        self.toast.update_idletasks()
        x = self.toast.winfo_screenwidth() - 380
        y = self.toast.winfo_screenheight() - 120
        self.toast.geometry(f"360x64+{max(x, 0)}+{max(y, 0)}")

    def _hotkey_result(self, problems: list[str]) -> None:
        if problems:
            self.settings_status.configure(text=" ".join(problems))
            self.root.deiconify()
            self.set_status(problems[0], hold=True)
            return
        record = self.settings.get("record") or {}
        stop = self.settings.get("stop") or {}
        if same(record, stop) or not stop:
            text = f"Ready. {record.get('label', 'Record')} records and stops."
        else:
            text = f"Ready. {record.get('label', 'Record')} records. {stop.get('label', 'Stop')} stops."
        self.settings_status.configure(text=text)
        self.set_status(text)
        if self.settings.get("api_key") and record:
            self.root.iconify()

    def _hotkey(self) -> None:
        import ctypes
        from ctypes import wintypes

        user32 = ctypes.windll.user32

        def clear() -> None:
            for hotkey_id in (1, 2, 3):
                user32.UnregisterHotKey(None, hotkey_id)

        def apply() -> None:
            clear()
            problems: list[str] = []
            record = self.settings.get("record")
            stop = self.settings.get("stop")
            if not record:
                problems.append("Choose the record keys.")
            elif same(record, stop) or not stop:
                if not user32.RegisterHotKey(None, 1, mask(record), int(record["vk"])):
                    problems.append(f"{record['label']} is already taken.")
            else:
                if not user32.RegisterHotKey(None, 1, mask(record), int(record["vk"])):
                    problems.append(f"{record['label']} is already taken.")
                if not user32.RegisterHotKey(None, 2, mask(stop), int(stop["vk"])):
                    problems.append(f"{stop['label']} is already taken.")
            if not user32.RegisterHotKey(None, 3, mask({"mods": ["ctrl", "alt"]}), 0x53):
                problems.append("Ctrl+Alt+S is already taken.")
            if problems:
                problems.append("Another program (or an older Studio Flow) holds these keys. Close it, then press Save.")
            self.root.after(0, lambda: self._hotkey_result(problems))

        apply()
        message = wintypes.MSG()
        while True:
            if self._reload.is_set():
                self._reload.clear()
                apply()
            if user32.PeekMessageW(ctypes.byref(message), None, 0, 0, 1):
                if message.message == 0x0312:
                    if message.wParam == 1:
                        self.root.after(0, self._record_hotkey)
                    elif message.wParam == 2:
                        self.root.after(0, self._finish)
                    elif message.wParam == 3:
                        self.root.after(0, self.root.deiconify)
                else:
                    user32.TranslateMessage(ctypes.byref(message))
                    user32.DispatchMessageW(ctypes.byref(message))
            else:
                time.sleep(0.03)

    def _record_hotkey(self) -> None:
        stop = self.settings.get("stop")
        if self.mode == "recording" and (not stop or same(self.settings.get("record"), stop)):
            self._finish()
            return
        self._start()

    def toggle(self) -> None:
        if self.mode == "working":
            return
        if self.mode == "recording":
            self._finish()
            return
        self._start()

    def _start(self) -> None:
        if self.mode != "idle":
            return
        if not (self.settings.get("api_key") or "").strip():
            self.set_status("Paste the API key from Studio. Press Ctrl+Alt+S.", hold=True)
            self.root.deiconify()
            return
        try:
            self.mic.start()
        except OSError as exc:
            self.set_status(str(exc), hold=True)
            return
        self.mode = "recording"
        self.sent = 0
        self.parts = []
        self.inflight = False
        self._stop_preview.clear()
        self.set_status("Listening 0:00", hold=True)
        self._tick()

    def _tick(self) -> None:
        if self.mode != "recording":
            return
        elapsed = self.mic.seconds()
        minutes, seconds = divmod(int(elapsed), 60)
        if not self.inflight:
            self.set_status(f"Listening {minutes}:{seconds:02d}")
        if elapsed >= MAX_SECONDS:
            self._finish()
            return
        unsent = self._unsent_seconds()
        if unsent >= CHUNK_SECONDS and not self.inflight:
            self._send_preview()
        self.root.after(500, self._tick)

    def _unsent_seconds(self) -> float:
        pcm, rate = self.mic.snapshot()
        return max(0, (len(pcm) - self.sent) / float(rate * 2 or 1))

    def _send_preview(self) -> None:
        pcm, rate = self.mic.snapshot()
        chunk = pcm[self.sent :]
        if len(chunk) < rate:
            return
        self.inflight = True
        taken = len(pcm)

        def work() -> None:
            try:
                text = transcribe(self._studio(), self.settings.get("api_key") or "", chunk, rate, self.set_status)
                if text:
                    self.parts.append(text)
                self.sent = taken
            except Exception as exc:
                self.set_status(str(exc))
            finally:
                self.inflight = False

        threading.Thread(target=work, daemon=True).start()

    def _finish(self) -> None:
        if self.mode != "recording":
            return
        self.mode = "working"
        pcm, rate = self.mic.stop()
        script = self.script.get()
        api_key = self.settings.get("api_key") or ""
        studio = self._studio()

        def work() -> None:
            try:
                while self.inflight:
                    time.sleep(0.1)
                tail = pcm[self.sent :]
                if len(tail) >= int(rate * 0.4):
                    self.set_status("Transcribing…", hold=True)
                    text = transcribe(studio, api_key, tail, rate, lambda message: self.set_status(message, hold=True))
                    if text:
                        self.parts.append(text)
                full = " ".join(part.strip() for part in self.parts if part.strip()).strip()
                if not full:
                    self.set_status("Didn't catch that. Start again and speak a little longer.")
                    return
                self.set_status("Shaping the text…", hold=True)
                shaped = format_text(studio, api_key, full, script, "plain", lambda message: self.set_status(message, hold=True))
                copy_and_paste(shaped or full)
                self.set_status("Inserted.")
            except Exception as exc:
                self.set_status(str(exc))
            finally:
                self.mode = "idle"

        threading.Thread(target=work, daemon=True).start()


def _read_chord() -> dict | None:
    import ctypes

    user32 = ctypes.windll.user32
    codes = list(range(0x30, 0x3A)) + list(range(0x41, 0x5B)) + list(range(0x70, 0x7C)) + [0x20]

    def held() -> int:
        for code in codes:
            if user32.GetAsyncKeyState(code) & 0x8000:
                return code
        return 0

    deadline = time.time() + 8
    while held() and time.time() < deadline:
        time.sleep(0.02)
    while time.time() < deadline:
        code = held()
        if not code:
            time.sleep(0.02)
            continue
        mods = []
        if any(user32.GetAsyncKeyState(item) & 0x8000 for item in (0x11, 0xA2, 0xA3)):
            mods.append("ctrl")
        if any(user32.GetAsyncKeyState(item) & 0x8000 for item in (0x12, 0xA4, 0xA5)):
            mods.append("alt")
        if any(user32.GetAsyncKeyState(item) & 0x8000 for item in (0x10, 0xA0, 0xA1)):
            mods.append("shift")
        if any(user32.GetAsyncKeyState(item) & 0x8000 for item in (0x5B, 0x5C)):
            mods.append("win")
        while held():
            time.sleep(0.02)
        return normalize(mods, code)
    return None


def main() -> None:
    root = tk.Tk()
    if not single_instance():
        from tkinter import messagebox

        root.withdraw()
        messagebox.showinfo(
            "Studio Flow",
            "Studio Flow is already running. Press Ctrl+Alt+S to open its settings, "
            "or find it in the taskbar.",
        )
        root.destroy()
        return
    App(root)
    root.mainloop()


if __name__ == "__main__":
    main()
