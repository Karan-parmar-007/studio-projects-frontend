# Studio Flow apps — desktop and Android

The two user-installed clients for WhisperFlow. They live in the `studio-frontend`
repo under `apps/` because the site serves them; the Vite build ignores this folder. Both need only one thing from the
user: an API key from [studio.karanparmar.in](https://studio.karanparmar.in) → APIs →
Voice Flow → Create key. The text they produce is pasted into whatever app, browser,
or game the user is typing in.

| Client | What it is | Install |
|---|---|---|
| `desktop/` | Python + tkinter tray app for Windows and Linux. Global hotkey records, stop pastes. | `StudioFlow.exe` / `StudioFlow` from the latest GitHub Release |
| `android/` | A keyboard (IME) with a mic key. | `StudioFlow.apk` from the latest GitHub Release |

Both talk only to `https://studio.karanparmar.in/api/studio/v1/whisperflow/*` with
`Authorization: Bearer sk-studio_...`. A `202` answer means the model is busy; the
clients poll `/jobs/{id}` and show "queued, position N".

## Desktop

```bash
cd apps/desktop
python flow.py                      # run from source (Python 3.12, tkinter)
pip install -r requirements-dev.txt && pytest
pyinstaller StudioFlow.spec         # build dist/StudioFlow(.exe)
```

Settings live in `%APPDATA%\StudioFlow\settings.json` (Windows) or
`~/.config/StudioFlow/settings.json` (Linux). The "Studio address" field in the
settings window defaults to `https://studio.karanparmar.in`; point it at
`http://127.0.0.1:8001` to use a dev server.

Linux needs `arecord` (alsa-utils), `wl-copy` or `xclip`, and `wtype` or `xdotool`.

## Android

```bash
cd apps/android
./gradlew assembleDebug        # app/build/outputs/apk/debug/app-debug.apk
```

Then Settings → System → Languages & input → enable "Studio Flow" and pick it as the
keyboard. The app's own settings screen has the API key and a "Studio address"
field (default `https://studio.karanparmar.in`; use a LAN address for a dev server).

## Releases

The apps are standalone: PyInstaller bundles Python, Tk, PortAudio (mic) and the
hotkey library, so users install nothing. Push a tag `apps-vX.Y.Z`. `.github/workflows/apps-release.yml` builds the Windows and Linux binaries and the
APK and attaches them to a GitHub Release. Add the four `ANDROID_*` secrets to get
a store-signed APK; without them the APK is debug-signed (fine for sideloading).

## macOS note

The first launch needs Microphone and Accessibility permission (System Settings, Privacy & Security). The global shortcut needs Accessibility; the in-window Record button works without it. The build is unsigned, so the first open is right-click, Open.
