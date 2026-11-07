import os
import tempfile

import numpy as np
import soundfile as sf


def read(path: str, sr: int, max_seconds: float | None = None) -> np.ndarray:
    """Mono float32 at `sr`, trimmed to `max_seconds`."""
    import soxr

    wav, src = sf.read(path, dtype="float32", always_2d=True)
    wav = wav.mean(axis=1)
    if src != sr:
        wav = soxr.resample(wav, src, sr)
    if max_seconds:
        wav = wav[: int(max_seconds * sr)]
    return wav


def write(wav: np.ndarray, sr: int) -> str:
    fd, path = tempfile.mkstemp(suffix=".wav")
    os.close(fd)
    sf.write(path, np.clip(wav, -1, 1), sr, subtype="PCM_16")
    return path
