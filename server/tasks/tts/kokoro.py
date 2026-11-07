import os
import sys
from functools import cache

import torch

from ...runtime import DEVICE, gpu_task, snapshot

REPO = "anyantudre/moore-tts-kokoro"
SETTINGS = {"sampling": False}


@cache
def _load():
    root = snapshot(REPO)
    sys.path.insert(0, os.path.join(root, "code"))
    import speak  # the repo's own G2P + chunking + KModel loader

    return root, speak, speak.load(root, DEVICE)


@cache
def _voice(name: str):
    root = _load()[0]
    return torch.load(os.path.join(root, "voices", name + ".pt"), map_location=DEVICE, weights_only=True)


@gpu_task(duration=30)
def synthesize(text, voice, speed, reference=None, reference_text=""):
    _, speak, model = _load()
    return speak.speak(model, _voice(voice), text, speed), 24000
