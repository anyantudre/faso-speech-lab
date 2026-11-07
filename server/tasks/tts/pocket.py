from functools import cache, lru_cache

import numpy as np

from ...runtime import gpu_task

CONFIG = "hf://anyantudre/moore-tts-pocket/moore.yaml"
SETTINGS = {"config": "moore.yaml", "cfg": "model default"}


@cache
def _load():
    from pocket_tts import TTSModel

    return TTSModel.load_model(config=CONFIG)


@lru_cache(maxsize=8)
def _state(reference: str):
    return _load().get_state_for_audio_prompt(reference)


@gpu_task(duration=60)
def synthesize(text, voice, speed, reference, reference_text=""):
    model = _load()
    wav = model.generate_audio(_state(reference), text)
    wav = wav.detach().cpu().numpy() if hasattr(wav, "detach") else np.asarray(wav)
    return wav.squeeze().astype(np.float32), model.sample_rate
