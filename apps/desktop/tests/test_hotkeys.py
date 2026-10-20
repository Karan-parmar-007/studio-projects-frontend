from hotkeys import normalize, same


def test_a_letter_alone_is_not_a_shortcut():
    assert normalize([], ord("P")) is None


def test_ctrl_alt_p_has_a_label():
    chord = normalize(["alt", "ctrl"], ord("P"))
    assert chord is not None
    assert chord["label"] == "Ctrl+Alt+P"
    assert chord["mods"] == ["ctrl", "alt"]


def test_function_key_can_stand_alone():
    chord = normalize([], 0x74)
    assert chord is not None
    assert chord["label"] == "F5"


def test_same_combo_matches_record_and_stop():
    record = normalize(["ctrl", "shift"], ord("R"))
    stop = normalize(["shift", "ctrl"], ord("R"))
    assert same(record, {"mods": ["ctrl", "shift"], "vk": ord("R"), "label": "Ctrl+Shift+R"})
    assert stop is not None
    assert not same(record, normalize(["ctrl"], ord("S")))
