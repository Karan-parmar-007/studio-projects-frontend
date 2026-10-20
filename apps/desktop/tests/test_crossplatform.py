"""Pure logic for the cross-platform mic and hotkeys. No GUI, no audio device."""

import record
from hotkeys import chord_matches, normalize, vk_from_char


def test_sounddevice_is_the_first_mic_backend():
    mic = record.Mic()
    makers = list(mic._backends())
    first = makers[0]()
    assert isinstance(first, record._SoundDeviceMic)


def test_vk_from_char_maps_letters_and_digits():
    assert vk_from_char("a") == 0x41
    assert vk_from_char("A") == 0x41
    assert vk_from_char("5") == 0x35
    assert vk_from_char("-") == 0
    assert vk_from_char("") == 0


def test_chord_matches_needs_same_mods_and_key():
    chord = normalize(["ctrl", "alt"], 0x20)  # Ctrl+Alt+Space
    assert chord_matches(chord, {"ctrl", "alt"}, 0x20) is True
    assert chord_matches(chord, {"ctrl"}, 0x20) is False          # missing alt
    assert chord_matches(chord, {"ctrl", "alt"}, 0x41) is False   # wrong key
    assert chord_matches(None, {"ctrl"}, 0x41) is False


def test_gkey_translates_pynput_keys():
    import gkey

    class FakeKey:
        def __init__(self, char=None, name=""):
            if char is not None:
                self.char = char
            self.name = name

    assert gkey._mod_of(FakeKey(name="ctrl_l")) == "ctrl"
    assert gkey._mod_of(FakeKey(name="cmd")) == "win"
    assert gkey._mod_of(FakeKey(char="a", name="")) is None
    assert gkey._vk_of(FakeKey(char="k")) == 0x4B
    assert gkey._vk_of(FakeKey(name="space")) == 0x20
    assert gkey._vk_of(FakeKey(name="f5")) == 0x74
