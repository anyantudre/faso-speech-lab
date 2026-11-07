"""MMS-TTS-mos (VITS, 36M) fine-tuned on all 13 readers: the multi-speaker finalist, step 8000 of the
archived run (moore-tts-checkpoints, mms/b_all). Small enough to run on the CPU."""
import json
import re
import unicodedata
from functools import cache
from pathlib import Path

import numpy as np
import torch

from ...runtime import snapshot

REPO = "anyantudre/moore-tts-checkpoints"
PATH = "mms/b_all/snapshots/step-008000"
SETTINGS = {"checkpoint": PATH}

# vocab of facebook/mms-tts-mos; "|" is the pad token. ɛ̃ ɩ̃ ʋ̃ have no precomposed form and lose the tilde.
VOCAB = set("anebmgsoydltẽikãrɩ-ʋwzpuõfɛũĩv'–6 ")
QUOTES = {"’": "'", "‘": "'", "ʼ": "'"}


def to_mms(text: str) -> str:
    """The training front-end: NFC, lowercase, curly quotes to ', other characters dropped."""
    text = unicodedata.normalize("NFC", text.lower())
    out = "".join(" " if c.isspace() else QUOTES.get(c, c) for c in text)
    return re.sub(r" +", " ", "".join(c for c in out if c in VOCAB)).strip()


def _plain(model):
    """Removes weight norm from a fresh model, so it takes the snapshot's merged weights."""
    from torch.nn.utils import parametrize

    for m in list(model.modules()):
        if parametrize.is_parametrized(m, "weight"):
            parametrize.remove_parametrizations(m, "weight", leave_parametrized=True)
        elif hasattr(m, "weight_g") and hasattr(m, "weight_v"):
            torch.nn.utils.remove_weight_norm(m)
    return model


@cache
def _load():
    from safetensors.torch import load_file
    from transformers import VitsConfig, VitsModel, VitsTokenizer

    root = Path(snapshot(REPO, f"{PATH}/*")) / PATH
    weights = load_file(root / "model.safetensors")
    config = VitsConfig.from_pretrained(root)
    config.num_speakers, config.speaker_embedding_size = weights["embed_speaker.weight"].shape
    model = _plain(VitsModel(config))
    model.load_state_dict({k: weights[k] for k in model.state_dict()}, strict=True)
    speakers = json.loads((root / "speakers.json").read_text(encoding="utf-8"))
    return model.eval(), VitsTokenizer.from_pretrained(root), speakers


def synthesize(text, voice, speed, reference=None, reference_text=""):
    model, tokenizer, speakers = _load()
    text = to_mms(text)
    if not text:
        raise ValueError("Nothing left to read once the text is reduced to the letters MMS knows.")
    inputs = tokenizer(text, return_tensors="pt")
    model.speaking_rate = speed
    with torch.inference_mode():
        wav = model(**inputs, speaker_id=int(speakers[voice])).waveform[0]
    return wav.float().numpy().astype(np.float32), model.config.sampling_rate
