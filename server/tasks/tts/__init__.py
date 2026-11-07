"""Text to speech. Each engine module exposes `synthesize(text, voice, speed, reference, reference_text)`
and returns (waveform, sample_rate)."""
import importlib
import time

import numpy as np
import torch

from ... import audio, registry
from ...registry import Model, Task
from ...runtime import HAS_GPU

MAX_CHARS = 500
SR = 24000

registry.task(Task("tts", "Text to speech", "Mooré text read aloud."))

KOKORO_VOICES = ["V04", "V05", "V06", "V07", "V08", "V09", "V10", "V11", "V13", "V14", "V15", "V19", "Vmisc"]
REFERENCES = [f"samples/{i}_reference.flac" for i in range(1, 5)]

registry.model(Model(
    id="kokoro", task="tts", name="Kokoro 82M", repo="anyantudre/moore-tts-kokoro", base="hexgrad/Kokoro-82M",
    summary="Fixed voices of the training readers, faster than real time on a CPU.",
    voices=KOKORO_VOICES, scores={"test": 0.38, "test_unseen": 0.43}, default=True, sampling=False,
))
registry.model(Model(
    id="pocket", task="tts", name="Pocket TTS", repo="anyantudre/moore-tts-pocket", base="kyutai/pocket-tts",
    summary="Distilled 6-layer model that clones a voice from a 5 s clip on a CPU.",
    cloning=True, voices=REFERENCES, scores={"test": 1.89, "test_unseen": 2.67},
))
registry.model(Model(
    id="omnivoice", task="tts", name="OmniVoice", repo="anyantudre/moore-tts-omnivoice", base="k2-fsa/OmniVoice",
    summary="Zero-shot voice cloning from a few seconds of reference audio.",
    device="gpu", cloning=True, voices=REFERENCES, scores={"test": 0.90, "test_unseen": 1.07}, needs="omnivoice",
    samples=[f"samples/{i}_model.wav" for i in range(1, 5)],
))
registry.model(Model(
    id="mms", task="tts", name="MMS-TTS (multi-speaker)", repo="anyantudre/moore-tts-checkpoints",
    base="facebook/mms-tts-mos", summary="Small VITS model (36M) fine-tuned on all 13 readers, fast on a CPU.",
    voices=KOKORO_VOICES, scores={"dev": 14.19},
))
registry.model(Model(
    id="spark", task="tts", name="Spark-TTS 0.5B", repo="anyantudre/moore-tts-spark", base="SparkAudio/Spark-TTS-0.5B",
    summary="Qwen-based codec language model that clones a voice from a short clip.",
    device="gpu", cloning=True, voices=REFERENCES, scores={"test": 1.55, "test_unseen": 1.50}, needs="einx",
    samples=[f"samples/{i}_model.wav" for i in range(1, 5)],
))
registry.model(Model(
    id="f5", task="tts", name="F5-TTS", repo="anyantudre/moore-tts-f5", base="SWivid/F5-TTS",
    summary="Flow-matching model that clones a voice from a short clip and its transcript.",
    device="gpu", cloning=True, voices=REFERENCES, scores={"test": 1.95, "test_unseen": 2.33}, needs="f5_tts",
    samples=[f"samples/{i}_model.wav" for i in range(1, 5)],
))
registry.model(Model(
    id="chatterbox", task="tts", name="Chatterbox", repo="anyantudre/moore-tts-chatterbox",
    base="ResembleAI/chatterbox",
    summary="Chatterbox Multilingual with a Mooré LoRA, clones a voice from a short clip.",
    device="gpu", cloning=True, voices=REFERENCES, scores={"test": 1.30, "test_unseen": 1.44}, needs="chatterbox",
    samples=[f"samples/{i}_model.wav" for i in range(1, 5)],
))


def preload():
    """Loads every runnable model now. On ZeroGPU, models must reach CUDA at startup, not inside a request."""
    for m in registry.MODELS.values():
        if m.task == "tts" and registry.runnable(m, HAS_GPU):
            importlib.import_module(f".{m.id}", __name__)._load()


def run(text: str, model_id: str, voice: str, speed: float, reference: str | None, reference_text: str,
        seed: int = 0) -> dict:
    text = " ".join(text.split())
    if not text:
        raise ValueError("Type some Mooré text first.")
    if len(text) > MAX_CHARS:
        raise ValueError(f"Keep the text under {MAX_CHARS} characters.")
    m = registry.get(model_id, "tts")
    if not registry.runnable(m, HAS_GPU):
        raise ValueError(f"{m.name} needs a GPU, which this Space does not have yet.")
    if m.cloning and not reference:
        if voice not in m.voices:
            raise ValueError("Pick a reference voice or upload one.")
        from ...runtime import hub_file
        reference = hub_file(m.repo, voice)
    elif not m.cloning and voice not in m.voices:
        raise ValueError(f"Unknown voice: {voice}")
    engine = importlib.import_module(f".{model_id}", __name__)
    torch.manual_seed(seed)
    np.random.seed(seed)
    t0 = time.perf_counter()
    wav, sr = engine.synthesize(text, voice, speed, reference, reference_text)
    return {"audio": audio.write(wav, sr), "seconds": round(len(wav) / sr, 2),
            "elapsed": round(time.perf_counter() - t0, 2), "text": text, "sample_rate": sr,
            "settings": getattr(engine, "SETTINGS", {}) | {"speed": speed, "seed": seed}}
