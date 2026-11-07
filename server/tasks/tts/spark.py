"""Spark-TTS 0.5B fine-tuned for Mooré, through the upstream SparkTTS class at a pinned commit, as in the
model card: the reference clip conditions the voice and its transcript is not used."""
import io
import sys
import tempfile
import urllib.request
import zipfile
from functools import cache
from pathlib import Path

import numpy as np
import torch

from ...runtime import DEVICE, gpu_task, snapshot

REPO = "anyantudre/moore-tts-spark"
COMMIT = "2f1ea9082400547242641f5271b6f941c9f439d1"  # SparkAudio/Spark-TTS, the commit the model was trained with
SETTINGS = {"temperature": 0.8, "top_k": 50, "top_p": 0.95}  # upstream defaults, as in the benchmark


@cache
def _code() -> Path:
    """Spark-TTS is not a package: fetch its source once and put it on the path."""
    root = Path(tempfile.gettempdir()) / f"Spark-TTS-{COMMIT[:7]}"
    if not root.exists():
        url = f"https://codeload.github.com/SparkAudio/Spark-TTS/zip/{COMMIT}"
        with urllib.request.urlopen(url, timeout=60) as r, zipfile.ZipFile(io.BytesIO(r.read())) as z:
            z.extractall(root.parent)
        (root.parent / f"Spark-TTS-{COMMIT}").rename(root)
    sys.path.insert(0, str(root))
    return root


@cache
def _load():
    _code()
    from cli.SparkTTS import SparkTTS

    return SparkTTS(Path(snapshot(REPO)), torch.device(DEVICE))


@gpu_task(duration=60)
def synthesize(text, voice, speed, reference, reference_text=""):
    model = _load()
    with torch.inference_mode():
        wav = model.inference(text, prompt_speech_path=reference, **SETTINGS)
    wav = wav.detach().cpu().numpy() if hasattr(wav, "detach") else np.asarray(wav)
    return wav.squeeze().astype(np.float32), model.sample_rate
