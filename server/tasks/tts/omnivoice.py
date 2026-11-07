from functools import cache

import numpy as np
import torch

from ...runtime import DEVICE, TOKEN, gpu_task

REPO = "anyantudre/moore-tts-omnivoice"
SETTINGS = {"language": "gur"}


@cache
def _load():
    from omnivoice import OmniVoice

    return OmniVoice.from_pretrained(REPO, device_map=DEVICE, dtype=torch.float16, token=TOKEN)


@gpu_task(duration=60)
def synthesize(text, voice, speed, reference, reference_text=""):
    model = _load()
    wav = model.generate(text=text, language="gur", ref_audio=reference, ref_text=reference_text or None)
    wav = wav[0] if isinstance(wav, list) else wav
    wav = wav.detach().cpu().numpy() if hasattr(wav, "detach") else np.asarray(wav)
    return wav.squeeze().astype(np.float32), model.sampling_rate
