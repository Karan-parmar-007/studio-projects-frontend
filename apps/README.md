# Studio Flow apps

The clients for WhisperFlow. Users enter only their API key: every app talks to
`https://studio.karanparmar.in`, and the address is not shown or editable anywhere.

| Folder | What it is |
|---|---|
| `desktop/` | Standalone app for Windows (`.exe`) and Linux (single binary). A global shortcut or the Record button records; the text is pasted where you were typing. |
| `android/` | A floating bubble that appears next to any text box in any app, above your normal keyboard. Tap, speak, tap again; the text is written into the box. |

## Release (built on this PC, never in CI)

```bash
cd apps
./release.sh 0.3.0                 # Windows + Linux + Android, then upload
./release.sh 0.3.0 android         # only some platforms
./release.sh 0.3.0 --no-upload     # build only, files in apps/out/
```

- Windows and Linux are built in Docker containers, so Docker Desktop must be running.
  Android is built with Gradle directly.
- Uploading needs `STUDIO_RELEASE_TOKEN`, the same value as in the server's studio
  `.env`. Put it in `apps/.release.env` (git-ignored):

  ```
  STUDIO_RELEASE_TOKEN=...
  ```

- Instead of the token you can upload the files from `apps/out/` on the Admin page.
- macOS can only be built on a Mac: run `pyinstaller StudioFlow.spec` in `desktop/`,
  zip `dist/StudioFlow.app`, and upload it on the Admin page.
- Every Android release needs a higher version than the last; the script derives the
  version code from `x.y.z`, so always raise the version.

## Android bubble: how it works

- `FlowAccessibilityService` draws the bubble (an accessibility overlay that never takes
  focus) and writes text into the focused box at the cursor, falling back to paste.
  If no box is focused any more, the text is copied to the clipboard.
- `RecorderService` holds the microphone. Android only allows background recording from
  a foreground service started while the app is on screen, so opening the app starts it
  and it shows a small "Studio Flow is ready" notification.
- First run: paste the key, allow the microphone, switch on Studio Flow under
  Accessibility (on Android 13+ for an APK installed from a file: App info, ⋮,
  Allow restricted settings), then Start.
- Test build against another server: `./gradlew assembleDebug -PstudioUrl=http://<ip>:8001`.

## Desktop

`python flow.py` runs it from source; `pytest` runs the tests. For a dev server, start it
with `STUDIO_URL=http://127.0.0.1:8001` in the environment; users never see this.
