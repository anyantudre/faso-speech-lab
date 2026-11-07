"""Chatterbox Multilingual V3 + the Mooré LoRA, following the repo's code/synth.py."""
from functools import cache
from pathlib import Path

import numpy as np
import torch

from ...runtime import DEVICE, gpu_task, repo_module, snapshot

REPO = "anyantudre/moore-tts-chatterbox"
SETTINGS = {"temperature": 0.6, "cfg_weight": 0.5, "repetition_penalty": 1.2, "min_p": 0.05, "top_p": 1.0}


@cache
def _load():
    root = snapshot(REPO)
    synth = repo_module(root, "synth.py", "chatterbox_synth")
    import cbx_common
    from peft import peft_model
    from peft.utils import save_and_load

    # PEFT reads the LoRA straight onto the GPU, which ZeroGPU's startup emulation cannot do: read it on
    # the CPU, load_model then moves the merged model to DEVICE.
    modules = (peft_model, save_and_load)
    infer = [m.infer_device for m in modules]
    for m in modules:
        m.infer_device = lambda: "cpu"
    try:
        return cbx_common, synth.load_model(Path(root), cbx_common.resolve_base(), DEVICE, "[sw]")
    finally:
        for m, f in zip(modules, infer, strict=True):
            m.infer_device = f


@gpu_task(duration=90)
def synthesize(text, voice, speed, reference, reference_text=""):
    from chatterbox.models.s3tokenizer import drop_invalid_tokens
    from chatterbox.models.t3.modules.cond_enc import T3Cond

    c, (fe, t3, s3gen, ve) = _load()
    wav24 = c.load_wav24(reference)
    emb, prompt, _ = c.t3_ref(wav24, s3gen, ve)
    ids = fe.encode(text)
    if c.UNK_ID in ids:
        raise ValueError("The text has characters this model does not know.")
    with torch.inference_mode():
        ref = s3gen.embed_ref(wav24[: c.DEC_COND_LEN], c.S3GEN_SR, device=DEVICE)
        cond = T3Cond(speaker_emb=emb.to(DEVICE), cond_prompt_speech_tokens=prompt.to(DEVICE),
                      emotion_adv=0.5 * torch.ones(1, 1, 1)).to(device=DEVICE)
        tokens = torch.tensor([[c.SOT, *ids, c.EOT]] * 2, dtype=torch.long, device=DEVICE)
        speech = t3.inference(t3_cond=cond, text_tokens=tokens, max_new_tokens=1000, **SETTINGS)
        speech = drop_invalid_tokens(speech[0])
        speech = speech[speech < c.SPEECH_VOCAB].to(DEVICE)
        if speech.numel() == 0:
            raise ValueError("The model produced no speech for this text.")
        wav, _ = s3gen.inference(speech_tokens=speech, ref_dict=ref)
    wav = wav.squeeze(0).float().cpu().numpy()[: max(1, speech.numel() - 1) * (c.S3GEN_SR // 25)]
    import perth

    wav = perth.PerthImplicitWatermarker().apply_watermark(wav, sample_rate=c.S3GEN_SR)
    return np.asarray(wav, dtype=np.float32), c.S3GEN_SR
