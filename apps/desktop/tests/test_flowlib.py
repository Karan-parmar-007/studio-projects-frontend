import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from flowlib import format_text, transcribe, wav_from_pcm


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length") or 0)
        json.loads(self.rfile.read(length) or b"{}")
        if self.path == "/api/studio/v1/whisperflow/transcribe":
            body = {"text": "point 1 home. point 2 keyboard."}
        elif self.path == "/api/studio/v1/whisperflow/format":
            body = {"text": "1. Home\n2. Keyboard"}
        elif self.path == "/busy":
            body = {
                "job_id": "job1",
                "status": "queued",
                "lane": "voice",
                "position": 1,
                "detail": "Your request is queued.",
                "poll": "/api/studio/v1/whisperflow/jobs/job1",
            }
            raw = json.dumps(body).encode()
            self.send_response(202)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)
            return
        else:
            self.send_response(404)
            self.end_headers()
            return
        raw = json.dumps(body).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        body = {"id": "job1", "status": "done", "result": {"text": "1. Home"}}
        raw = json.dumps(body).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def log_message(self, _format, *_args):
        return


def test_transcribe_and_format_round_trip():
    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f"http://127.0.0.1:{server.server_address[1]}"
    try:
        heard = transcribe(base, "token", b"\x00\x00" * 1600, 16000, lambda _message: None)
        assert heard.startswith("point 1")
        shaped = format_text(base, "token", heard, "roman", "plain", lambda _message: None)
        assert shaped.startswith("1. Home")
        wav = wav_from_pcm(b"\x01\x00" * 160)
        assert wav[:4] == b"RIFF"
    finally:
        server.shutdown()


def test_a_queued_formatter_is_waited_on():
    messages = []

    class Queued(Handler):
        def do_POST(self):
            self.path = "/busy"
            super().do_POST()

    server = ThreadingHTTPServer(("127.0.0.1", 0), Queued)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_address[1]}"
    try:
        text = format_text(base, "token", "hello", "roman", "plain", messages.append)
    finally:
        server.shutdown()
    assert text == "1. Home"
    assert messages[0].startswith("Your request is queued.")
    assert "position 1" in messages[0]
