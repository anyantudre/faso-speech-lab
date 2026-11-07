"""Hardware detection, the ZeroGPU decorator and Hub downloads.

`spaces` must be imported before torch for ZeroGPU, so app.py imports this module first."""
import os
from functools import cache

try:
    import spaces

    gpu_task = spaces.GPU  # no-op outside ZeroGPU
except ImportError:  # local runs without the `spaces` package

    def gpu_task(fn=None, **_):
        return fn if fn is not None else (lambda f: f)


import torch

ZERO_GPU = os.environ.get("SPACES_ZERO_GPU") is not None
HAS_GPU = ZERO_GPU or torch.cuda.is_available()
DEVICE = "cuda" if HAS_GPU else "cpu"
TOKEN = os.environ.get("HF_TOKEN")


@cache
def snapshot(repo: str, *patterns: str) -> str:
    from huggingface_hub import snapshot_download

    return snapshot_download(repo, token=TOKEN, allow_patterns=list(patterns) or None)


@cache
def revision(repo: str) -> str:
    """Commit sha of a model repo, so a run can be reproduced; empty if the Hub cannot be reached."""
    from huggingface_hub import model_info

    try:
        return model_info(repo, token=TOKEN).sha or ""
    except Exception:  # noqa: BLE001  (a missing sha must never fail a run)
        return ""


def hub_file(repo: str, filename: str) -> str:
    from huggingface_hub import hf_hub_download

    return hf_hub_download(repo, filename, token=TOKEN)
