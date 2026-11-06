"""Talk to the speech service and the formatter, including the queue."""

from __future__ import annotations

import base64
import sys
import io
import json
import time
import urllib.error
import urllib.request
import wave


def wav_from_pcm(pcm: bytes, rate: int = 16000) -> bytes:
    if len(pcm) % 2:
        pcm = pcm[:-1]
    buf = io.BytesIO()
    with wave.open(buf, "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(rate)
        handle.writeframes(pcm)
    return buf.getvalue()


def _detail(body: dict) -> str:
    detail = body.get("detail")
    if isinstance(detail, str) and detail.strip():
        return detail.strip()
    if body.get("code") == "model_offline":
        return "The app is currently not working."
    return "The request failed"


def request_json(method: str, url: str, api_key: str, payload: dict | None = None, timeout: float = 180):
    data = None if payload is None else json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if api_key:
        req.add_header("Authorization", f"Bearer {api_key}")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            raw = response.read().decode() or "{}"
            return response.status, json.loads(raw)
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            body = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            body = {"detail": raw or str(exc.reason)}
        return exc.code, body


def _wait(base: str, api_key: str, job: dict, on_status) -> str:
    while True:
        status = job.get("status")
        if status == "queued":
            on_status(
                f"Your request is queued. {job.get('lane', 'voice')} line, position {job.get('position', 1)}."
            )
        elif status == "running":
            on_status("Your request is running.")
        elif status == "done":
            result = job.get("result") or {}
            if isinstance(result, dict):
                return str(result.get("text") or "")
            return str(job.get("text") or "")
        elif status == "error":
            raise RuntimeError(_detail(job))
        elif job.get("text"):
            return str(job.get("text") or "")
        else:
            raise RuntimeError(_detail(job))
        job_id = job.get("job_id") or job.get("id")
        poll = job.get("poll") or f"/api/studio/v1/whisperflow/jobs/{job_id}"
        time.sleep(1.2)
        code, job = request_json("GET", f"{base.rstrip('/')}{poll}", api_key, timeout=30)
        if code >= 400:
            raise RuntimeError(_detail(job))


def call_until_done(base: str, path: str, api_key: str, payload: dict, on_status) -> str:
    code, body = request_json("POST", f"{base.rstrip('/')}{path}", api_key, payload)
    if code == 202:
        return _wait(base, api_key, body, on_status)
    if code >= 400:
        raise RuntimeError(_detail(body))
    return str(body.get("text") or "")


def transcribe(base: str, api_key: str, pcm: bytes, rate: int, on_status) -> str:
    wav = wav_from_pcm(pcm, rate)
    payload = {"audio_base64": base64.b64encode(wav).decode()}
    return call_until_done(base, "/api/studio/v1/whisperflow/transcribe", api_key, payload, on_status).strip()


def format_text(base: str, api_key: str, text: str, script: str, tone: str, on_status) -> str:
    payload = {"text": text, "script": script, "tone": tone}
    return call_until_done(base, "/api/studio/v1/whisperflow/format", api_key, payload, on_status).strip()


def quiet_cut(pcm: bytes, rate: int, start: int, end: int, search_seconds: float = 4.0, window_seconds: float = 0.3) -> int:
    """Where to end a chunk: the quietest moment in the last few seconds before `end`.

    Cutting on a pause keeps words whole, so the speech model never hears half of
    "no, 8". Works on 16-bit mono PCM byte offsets and always returns an even offset
    in (start, end]. Falls back to `end` when there is too little audio to choose from.
    """
    from array import array

    end -= end % 2
    window = int(rate * window_seconds) * 2
    lo = max(start, end - int(rate * search_seconds) * 2)
    lo += (lo - start) % 2
    if end - lo < window * 2:
        return end
    samples = array("h")
    samples.frombytes(pcm[lo:end])
    if sys.byteorder == "big":
        samples.byteswap()
    step = max(1, int(rate * 0.05))  # slide 50 ms at a time
    span = window // 2
    best_at, best_energy = len(samples), None
    for at in range(0, len(samples) - span + 1, step):
        energy = sum(abs(v) for v in samples[at : at + span])
        if best_energy is None or energy < best_energy:
            best_energy, best_at = energy, at + span // 2
    return lo + best_at * 2
