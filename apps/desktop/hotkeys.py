"""Shortcut names for record and stop."""

from __future__ import annotations

MOD_ORDER = ("ctrl", "alt", "shift", "win")
MOD_MASK = {"ctrl": 0x0002, "alt": 0x0001, "shift": 0x0004, "win": 0x0008}
MOD_NOREPEAT = 0x4000
_PRETTY = {"ctrl": "Ctrl", "alt": "Alt", "shift": "Shift", "win": "Win"}


def vk_name(vk: int) -> str:
    if 48 <= vk <= 57 or 65 <= vk <= 90:
        return chr(vk)
    if vk == 0x20:
        return "Space"
    if 0x70 <= vk <= 0x7B:
        return f"F{vk - 0x6F}"
    return ""


def normalize(mods: list[str], vk: int) -> dict | None:
    """A shortcut needs Ctrl, Alt, Shift, Win, or a function key."""
    names = [name for name in MOD_ORDER if name in mods]
    key = vk_name(vk)
    if not key:
        return None
    if not names and not (0x70 <= vk <= 0x7B):
        return None
    return {"mods": names, "vk": int(vk), "label": "+".join([_PRETTY[name] for name in names] + [key])}


def same(left: dict | None, right: dict | None) -> bool:
    if not left or not right:
        return False
    return list(left.get("mods") or []) == list(right.get("mods") or []) and int(left.get("vk") or 0) == int(right.get("vk") or 0)


def mask(chord: dict) -> int:
    value = MOD_NOREPEAT
    for name in chord.get("mods") or []:
        value |= MOD_MASK.get(name, 0)
    return value


# --- cross-platform helpers (used by gkey.py for mac/linux global hotkeys) ---

# Windows virtual-key codes we support, mapped to a portable description.
def vk_from_char(ch: str) -> int:
    """'a'/'A' -> 0x41, '0' -> 0x30. 0 if not a plain letter/digit."""
    if not ch:
        return 0
    c = ch.upper()
    if "A" <= c <= "Z" or "0" <= c <= "9":
        return ord(c)
    return 0


def chord_matches(chord: dict | None, mods: set[str], vk: int) -> bool:
    """True when the live modifiers + final key equal a saved chord."""
    if not chord or not vk:
        return False
    want_mods = set(chord.get("mods") or [])
    return want_mods == set(mods) and int(chord.get("vk") or 0) == int(vk)
