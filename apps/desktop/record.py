"""Microphone capture, 16 kHz mono 16-bit PCM.

The packaged apps bundle sounddevice (PortAudio), which works the same on Windows,
macOS, and Linux, so there is nothing for the user to install. When sounddevice is
not available (e.g. running from source), it falls back to the Windows wave mapper
or Linux arecord."""

from __future__ import annotations

import shutil
import subprocess
import sys
import threading
import time


class Mic:
    def __init__(self) -> None:
        self.pcm = bytearray()
        self.rate = 16000
        self._lock = threading.Lock()
        self._impl = None

    def start(self) -> None:
        with self._lock:
            self.pcm = bytearray()
        last: Exception | None = None
        for make in self._backends():
            try:
                impl = make()
                impl.start()
            except Exception as exc:  # noqa: BLE001 - try the next backend
                last = exc
                continue
            self._impl = impl
            self.rate = impl.rate
            return
        raise OSError(f"The microphone did not start: {last}")

    def _backends(self):
        """sounddevice first (cross-platform, bundled), then the OS fallback."""
        yield lambda: _SoundDeviceMic(self)
        if sys.platform == "win32":
            yield lambda: _WinMic(self)
        elif sys.platform != "darwin":
            yield lambda: _LinuxMic(self)

    def snapshot(self) -> tuple[bytes, int]:
        with self._lock:
            return bytes(self.pcm), self.rate

    def seconds(self) -> float:
        with self._lock:
            return len(self.pcm) / float(self.rate * 2 or 1)

    def stop(self) -> tuple[bytes, int]:
        if self._impl is not None:
            self._impl.stop()
            self._impl = None
        return self.snapshot()


class _SoundDeviceMic:
    """PortAudio via sounddevice. Raw int16 frames, no numpy needed."""

    def __init__(self, owner: "Mic") -> None:
        self.owner = owner
        self.rate = 16000
        self._stream = None

    def start(self) -> None:
        import sounddevice as sd  # raises ImportError when not bundled/installed

        def callback(indata, _frames, _time, _status) -> None:
            with self.owner._lock:
                self.owner.pcm.extend(bytes(indata))

        self._stream = sd.RawInputStream(
            samplerate=16000, channels=1, dtype="int16", callback=callback
        )
        self._stream.start()

    def stop(self) -> None:
        if self._stream is not None:
            try:
                self._stream.stop()
                self._stream.close()
            finally:
                self._stream = None


class _WinMic:
    def __init__(self, owner: Mic) -> None:
        self.owner = owner
        self.rate = 16000
        self.running = False
        self._handle = None
        self._callback = None
        self._headers = []
        self._buffers = []

    def start(self) -> None:
        import ctypes
        from ctypes import wintypes

        self.ctypes = ctypes
        self.winmm = ctypes.WinDLL("winmm")
        wave = self._wave_format(wintypes)
        header = self._wave_header()
        proc = ctypes.WINFUNCTYPE(
            None,
            ctypes.c_void_p,
            ctypes.c_uint,
            ctypes.c_size_t,
            ctypes.c_size_t,
            ctypes.c_size_t,
        )
        self._callback = proc(self._on_data)
        self.winmm.waveInOpen.restype = ctypes.c_uint
        self.winmm.waveInOpen.argtypes = [
            ctypes.POINTER(ctypes.c_void_p),
            ctypes.c_uint,
            ctypes.POINTER(wave),
            proc,
            ctypes.c_size_t,
            ctypes.c_uint,
        ]
        last = 0
        for rate in (16000, 48000, 44100):
            fmt = wave()
            fmt.wFormatTag = 1
            fmt.nChannels = 1
            fmt.nSamplesPerSec = rate
            fmt.nAvgBytesPerSec = rate * 2
            fmt.nBlockAlign = 2
            fmt.wBitsPerSample = 16
            fmt.cbSize = 0
            handle = ctypes.c_void_p()
            last = self.winmm.waveInOpen(
                ctypes.byref(handle),
                ctypes.c_uint(0xFFFFFFFF),
                ctypes.byref(fmt),
                self._callback,
                0,
                0x00030000,
            )
            if last == 0:
                self.rate = rate
                self._handle = handle
                self._header_type = header
                self._bind_wave(header)
                break
        if not self._handle:
            raise OSError(f"The microphone did not open (error {last})")
        self.running = True
        chunk = self.rate  # half a second of 16-bit mono
        for _ in range(6):
            buf = ctypes.create_string_buffer(chunk)
            hdr = header()
            hdr.lpData = ctypes.cast(buf, ctypes.c_void_p)
            hdr.dwBufferLength = chunk
            self.winmm.waveInPrepareHeader(self._handle, ctypes.byref(hdr), ctypes.sizeof(hdr))
            self.winmm.waveInAddBuffer(self._handle, ctypes.byref(hdr), ctypes.sizeof(hdr))
            self._buffers.append(buf)
            self._headers.append(hdr)
        started = self.winmm.waveInStart(self._handle)
        if started != 0:
            raise OSError(f"The microphone did not start (error {started})")

    def _wave_format(self, wintypes):
        class WAVEFORMATEX(self.ctypes.Structure):
            _fields_ = [
                ("wFormatTag", wintypes.WORD),
                ("nChannels", wintypes.WORD),
                ("nSamplesPerSec", wintypes.DWORD),
                ("nAvgBytesPerSec", wintypes.DWORD),
                ("nBlockAlign", wintypes.WORD),
                ("wBitsPerSample", wintypes.WORD),
                ("cbSize", wintypes.WORD),
            ]

        return WAVEFORMATEX

    def _wave_header(self):
        class WAVEHDR(self.ctypes.Structure):
            _fields_ = [
                ("lpData", self.ctypes.c_void_p),
                ("dwBufferLength", self.ctypes.c_uint),
                ("dwBytesRecorded", self.ctypes.c_uint),
                ("dwUser", self.ctypes.c_size_t),
                ("dwFlags", self.ctypes.c_uint),
                ("dwLoops", self.ctypes.c_uint),
                ("lpNext", self.ctypes.c_void_p),
                ("reserved", self.ctypes.c_size_t),
            ]

        return WAVEHDR

    def _bind_wave(self, header) -> None:
        pointer = self.ctypes.POINTER(header)
        handle = self.ctypes.c_void_p
        size = self.ctypes.c_uint
        for name in ("waveInPrepareHeader", "waveInAddBuffer", "waveInUnprepareHeader"):
            fn = getattr(self.winmm, name)
            fn.restype = self.ctypes.c_uint
            fn.argtypes = [handle, pointer, size]
        for name in ("waveInStart", "waveInStop", "waveInReset", "waveInClose"):
            fn = getattr(self.winmm, name)
            fn.restype = self.ctypes.c_uint
            fn.argtypes = [handle]

    def _on_data(self, hwi, msg, _instance, header_ptr, _param2) -> None:
        if msg != 0x3C0 or not header_ptr:
            return
        try:
            header = self.ctypes.cast(header_ptr, self.ctypes.POINTER(self._header_type)).contents
            count = int(header.dwBytesRecorded)
            if count > 0 and header.lpData:
                data = self.ctypes.string_at(header.lpData, count)
                with self.owner._lock:
                    self.owner.pcm.extend(data)
            if self.running:
                self.winmm.waveInAddBuffer(
                    hwi,
                    self.ctypes.cast(header_ptr, self.ctypes.POINTER(self._header_type)),
                    self.ctypes.sizeof(self._header_type),
                )
        except Exception:
            return

    def stop(self) -> None:
        self.running = False
        if not self._handle:
            return
        self.winmm.waveInStop(self._handle)
        self.winmm.waveInReset(self._handle)
        time.sleep(0.05)
        for header in self._headers:
            self.winmm.waveInUnprepareHeader(self._handle, self.ctypes.byref(header), self.ctypes.sizeof(header))
        self.winmm.waveInClose(self._handle)
        self._handle = None


class _LinuxMic:
    def __init__(self, owner: Mic) -> None:
        self.owner = owner
        self.rate = 16000
        self.proc: subprocess.Popen | None = None
        self._reader: threading.Thread | None = None

    def start(self) -> None:
        if shutil.which("arecord") is None:
            raise OSError("arecord is not installed, so this Linux session has no microphone path")
        self.proc = subprocess.Popen(
            ["arecord", "-q", "-f", "S16_LE", "-c", "1", "-r", "16000", "-t", "raw"],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
        )

        def read() -> None:
            assert self.proc is not None and self.proc.stdout is not None
            while True:
                chunk = self.proc.stdout.read(4096)
                if not chunk:
                    break
                with self.owner._lock:
                    self.owner.pcm.extend(chunk)

        self._reader = threading.Thread(target=read, daemon=True)
        self._reader.start()

    def stop(self) -> None:
        if self.proc is None:
            return
        self.proc.terminate()
        try:
            self.proc.wait(timeout=2)
        except subprocess.TimeoutExpired:
            self.proc.kill()
        if self._reader is not None:
            self._reader.join(timeout=2)
        self.proc = None
