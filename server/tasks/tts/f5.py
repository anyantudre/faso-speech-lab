"""F5-TTS v1 Base fine-tuned for Mooré, through the repo's own code/synth.py (upstream inference, text fed
as characters). F5 needs the transcript of the reference clip: when none is given, judge 1 writes it."""
import os
import sys
import types
from functools import cache

import numpy as np
import torch

from ...runtime import DEVICE, gpu_task, snapshot

REPO = "anyantudre/moore-tts-f5"
SETTINGS = {"nfe": 32, "cfg": 2.0, "sway": -1.0}  # synth.py defaults, as in the benchmark


@cache
def _load():
    root = snapshot(REPO)
    sys.path.insert(0, os.path.join(root, "code"))
    import synth
    from f5_tts.infer.utils_infer import load_vocoder

    # Load on the CPU, then move: F5's loader reads weights straight onto CUDA, which ZeroGPU's startup
    # emulation cannot do.
    dtype = torch.float16 if DEVICE == "cuda" else torch.float32
    model, _, mel, _ = synth.load(root, "cpu", dtype, False)
    vocoder = load_vocoder("vocos", device="cpu")
    return synth, model.to(DEVICE), vocoder.to(DEVICE), mel


@gpu_task(duration=60)
def synthesize(text, voice, speed, reference, reference_text=""):
    from ..asr import transcript

    synth, model, vocoder, mel = _load()
    prompt = reference_text.strip() or transcript(reference)
    prompt = "".join(c for c in prompt if c in model.vocab_char_map)
    args = types.SimpleNamespace(**SETTINGS, speed=speed, seed=torch.initial_seed())
    item = {"text": text, "prompt_path": reference, "prompt_text": prompt}
    try:
        wav, _, _ = synth.synth_one(model, vocoder, mel, item, args, DEVICE)
    except ValueError as e:
        if str(e).startswith("oov"):
            raise ValueError("F5-TTS does not know some characters of this text.") from e
        raise
    return np.asarray(wav, dtype=np.float32), mel["target_sample_rate"]
