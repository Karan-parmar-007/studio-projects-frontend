"""Only one Studio Flow may run: the second copy must see the lock held."""

import os
import subprocess
import sys


def test_second_process_sees_the_lock_held(tmp_path, monkeypatch):
    monkeypatch.setenv("HOME", str(tmp_path))  # settings dir -> tmp
    here = os.path.dirname(os.path.dirname(__file__))
    code = (
        "import sys, time; sys.path.insert(0, %r); import flow; "
        "print(flow.single_instance()); sys.stdout.flush(); time.sleep(3)"
    ) % here
    first = subprocess.Popen([sys.executable, "-c", code], stdout=subprocess.PIPE, text=True, env=dict(os.environ))
    assert first.stdout.readline().strip() == "True"
    second = subprocess.run([sys.executable, "-c", code.replace("time.sleep(3)", "pass")], capture_output=True, text=True, env=dict(os.environ), timeout=20)
    assert second.stdout.strip() == "False", second.stderr
    first.kill()
    first.wait()
