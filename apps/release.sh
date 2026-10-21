#!/usr/bin/env bash
# Build the Studio Flow apps on this PC and upload them to Studio (stored in Garage,
# served from the WhisperFlow download page). Nothing is built in CI.
#
#   ./release.sh 0.2.0                      build windows, linux, android and upload
#   ./release.sh 0.2.0 android              only some platforms
#   ./release.sh 0.2.0 --no-upload          build only; files land in apps/out/
#
# Needs: Docker running (Windows + Linux builds run in containers), and for uploads
# STUDIO_RELEASE_TOKEN (same value as in the server's studio .env). Put it in
# apps/.release.env (git-ignored) or export it:
#   STUDIO_RELEASE_TOKEN=...
#   STUDIO_UPLOAD_URL=https://studio.karanparmar.in     (optional, this is the default)
# macOS can only be built on a Mac: pyinstaller StudioFlow.spec there, then upload
# dist/StudioFlow.app zipped from the Admin page.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
VERSION="${1:-}"
[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "Usage: ./release.sh <x.y.z> [windows] [linux] [android] [--no-upload]"; exit 1; }
shift
UPLOAD=1
PLATFORMS=()
for arg in "$@"; do
  case "$arg" in
    --no-upload) UPLOAD=0 ;;
    windows|linux|android) PLATFORMS+=("$arg") ;;
    *) echo "Unknown argument: $arg"; exit 1 ;;
  esac
done
[ ${#PLATFORMS[@]} -eq 0 ] && PLATFORMS=(windows linux android)

[ -f "$HERE/.release.env" ] && { set -a; . "$HERE/.release.env"; set +a; }
URL="${STUDIO_UPLOAD_URL:-https://studio.karanparmar.in}"
if [ "$UPLOAD" = 1 ] && [ -z "${STUDIO_RELEASE_TOKEN:-}" ]; then
  echo "Set STUDIO_RELEASE_TOKEN (in apps/.release.env or the environment), or use --no-upload."
  exit 1
fi

OUT="$HERE/out"
mkdir -p "$OUT"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
UIDGID="$(id -u):$(id -g)"

wants() { [[ " ${PLATFORMS[*]} " == *" $1 "* ]]; }

desktop_source() {
  rm -rf "$WORK/desktop" && cp -r "$HERE/desktop" "$WORK/desktop"
  rm -rf "$WORK/desktop/build" "$WORK/desktop/dist" "$WORK/desktop/__pycache__" "$WORK/desktop/.pytest_cache"
}

if wants windows || wants linux; then
  if ! docker info >/dev/null 2>&1; then
    echo "Docker is not available. Start Docker Desktop (with WSL integration on), or build only Android:"
    echo "  ./release.sh $VERSION android"
    exit 1
  fi
fi

echo "== Desktop tests"
( cd "$HERE/desktop" && python3 -m pytest -q tests )

if wants linux; then
  echo "== Linux (python:3.12-slim container)"
  desktop_source
  docker run --rm -v "$WORK/desktop:/src" -w /src python:3.12-slim bash -c "
    apt-get update -qq >/dev/null && apt-get install -y -qq python3-tk tk libportaudio2 binutils build-essential linux-libc-dev >/dev/null 2>&1
    pip install -q -r requirements-dev.txt
    pyinstaller --clean --noconfirm --distpath dist/linux --workpath /tmp/w StudioFlow.spec >/tmp/build.log 2>&1 || { tail -30 /tmp/build.log; exit 1; }
    chown -R $UIDGID /src"
  cp "$WORK/desktop/dist/linux/StudioFlow" "$OUT/StudioFlow"
fi

if wants windows; then
  echo "== Windows (Wine PyInstaller container)"
  desktop_source
  rm -rf "$WORK/desktop/tests"
  docker run --rm -v "$WORK/desktop:/src" -w /src batonogov/pyinstaller-windows:latest \
    "pip install -q sounddevice==0.5.1 pynput==1.7.7 && pyinstaller --clean -y --distpath dist/windows --workpath /tmp/w StudioFlow.spec >/tmp/build.log 2>&1 || { tail -30 /tmp/build.log; exit 1; }; chown -R $UIDGID /src/dist" \
    | grep -vE "^wine:|fixme" || true
  [ -f "$WORK/desktop/dist/windows/StudioFlow.exe" ] || { echo "Windows build failed"; exit 1; }
  cp "$WORK/desktop/dist/windows/StudioFlow.exe" "$OUT/StudioFlow.exe"
fi

if wants android; then
  echo "== Android (Gradle)"
  IFS=. read -r MA MI PA <<< "$VERSION"
  CODE=$((MA * 10000 + MI * 100 + PA))
  ( cd "$HERE/android" && ./gradlew --no-daemon -q assembleRelease -PversionName="$VERSION" -PversionCode="$CODE" )
  cp "$HERE/android/app/build/outputs/apk/release/app-release.apk" "$OUT/StudioFlow.apk"
fi

echo "== Built in $OUT"
ls -la "$OUT"

[ "$UPLOAD" = 1 ] || { echo "Skipped upload (--no-upload)."; exit 0; }

upload() { # platform file content-type
  local name; name="$(basename "$2")"
  echo -n "== Upload $1 ($name) to $URL ... "
  curl -fsS --retry 3 -o /dev/null -w "%{http_code}\n" -X PUT "$URL/api/studio/admin/downloads/whisperflow/$1" \
    -H "Authorization: Bearer $STUDIO_RELEASE_TOKEN" \
    -H "X-Filename: $name" \
    -H "X-Version: $VERSION" \
    -H "Content-Type: $3" \
    --data-binary "@$2"
}
wants windows && upload windows "$OUT/StudioFlow.exe" application/vnd.microsoft.portable-executable
wants linux   && upload linux   "$OUT/StudioFlow"     application/octet-stream
wants android && upload android "$OUT/StudioFlow.apk" application/vnd.android.package-archive
echo "Done. Version $VERSION is live on the WhisperFlow download page."
