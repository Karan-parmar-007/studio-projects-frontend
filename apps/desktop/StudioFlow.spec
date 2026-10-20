# -*- mode: python ; coding: utf-8 -*-
# Cross-platform PyInstaller spec. Builds a standalone app so the user installs
# nothing (no Python, no pip). Run: pyinstaller --clean --noconfirm StudioFlow.spec
#   Windows -> dist/StudioFlow.exe   Linux -> dist/StudioFlow   macOS -> dist/StudioFlow.app
import sys

from PyInstaller.utils.hooks import collect_all

datas, binaries, hiddenimports = [], [], ["flowlib", "hotkeys", "record", "gkey"]

# Bundle PortAudio (sounddevice) and the pynput backends so the mic and global
# hotkeys work on a clean machine. Guarded so the build still runs if one is absent.
for package in ("sounddevice", "pynput"):
    try:
        pkg_datas, pkg_binaries, pkg_hidden = collect_all(package)
        datas += pkg_datas
        binaries += pkg_binaries
        hiddenimports += pkg_hidden
    except Exception as exc:  # noqa: BLE001
        print(f"spec: skipping {package}: {exc}")

# pynput picks its backend at import time and refuses to import on a build host with
# no display (CI runners, containers), so collect_all cannot see these. Name them
# explicitly; PyInstaller only warns about the ones that do not exist on this OS.
hiddenimports += [
    "pynput.keyboard._xorg", "pynput.mouse._xorg", "pynput._util.xorg", "pynput._util.xorg_keysyms",
    "pynput.keyboard._uinput",
    "pynput.keyboard._win32", "pynput.mouse._win32", "pynput._util.win32", "pynput._util.win32_vks",
    "pynput.keyboard._darwin", "pynput.mouse._darwin", "pynput._util.darwin", "pynput._util.darwin_vks",
    "pynput.keyboard._dummy", "pynput.mouse._dummy",
]
if sys.platform.startswith("linux"):
    try:
        from PyInstaller.utils.hooks import collect_submodules

        hiddenimports += collect_submodules("Xlib")
    except Exception as exc:  # noqa: BLE001
        print(f"spec: skipping Xlib: {exc}")

a = Analysis(
    ["flow.py"],
    pathex=["."],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    runtime_hooks=[],
    excludes=["pytest"],
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="StudioFlow",
    debug=False,
    strip=False,
    upx=False,
    console=False,
    icon=None,
)

if sys.platform == "darwin":
    app = BUNDLE(
        exe,
        name="StudioFlow.app",
        icon=None,
        bundle_identifier="in.karanparmar.studioflow",
        info_plist={
            "CFBundleShortVersionString": "1.0",
            "LSUIElement": True,  # background app; no bouncing dock icon stealing focus
            "NSMicrophoneUsageDescription": "Studio Flow records your voice to turn it into text.",
            "NSAppleEventsUsageDescription": "Studio Flow pastes the text into the app you are using.",
        },
    )
