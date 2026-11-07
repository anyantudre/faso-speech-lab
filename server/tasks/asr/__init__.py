"""Speech to text with a w2v-BERT 2.0 CTC model. Returns the transcript and per-word confidence
(mean max-probability of the CTC frames that emitted each word)."""
import time
import unicodedata
from functools import cache, lru_cache

import torch

from ... import audio, registry
from ...registry import Model, Task
from ...runtime import DEVICE, TOKEN, gpu_task

MAX_SECONDS = 60
SR = 16000

registry.task(Task("asr", "Speech to text", "Upload or record Mooré speech and read the transcript."))
registry.model(Model(
    id="w2v-bert", task="asr", name="w2v-BERT 2.0 Mooré", repo="anyantudre/mos-w2v-bert-2.0-bench",
    base="facebook/w2v-bert-2.0", summary="CTC model over Mooré characters, judge 1 of MooreSpeechBench.",
    scores={"dev": 1.30}, default=True,
))
MODELS_JUDGE = "anyantudre/mos-w2v-bert-2.0-bench"


@cache
def _load(repo: str):
    from transformers import Wav2Vec2BertForCTC, Wav2Vec2BertProcessor

    proc = Wav2Vec2BertProcessor.from_pretrained(repo, token=TOKEN)
    model = Wav2Vec2BertForCTC.from_pretrained(repo, token=TOKEN).to(DEVICE).eval()
    return proc, model


def preload():
    for m in registry.MODELS.values():
        if m.task == "asr":
            _load(m.repo)


def _words(ids: list[int], probs: list[float], proc) -> list[dict]:
    """Collapse CTC frames into words with a confidence each."""
    tok = proc.tokenizer
    blank, space = tok.pad_token_id, tok.word_delimiter_token_id
    words, chars, conf, prev = [], [], [], None
    for i, p in zip(ids, probs, strict=True):
        if i != prev and i != blank:
            if i == space:
                if chars:
                    words.append({"word": "".join(chars), "confidence": round(sum(conf) / len(conf), 3)})
                chars, conf = [], []
            else:
                chars.append(tok.convert_ids_to_tokens(i))
                conf.append(p)
        prev = i
    if chars:
        words.append({"word": "".join(chars), "confidence": round(sum(conf) / len(conf), 3)})
    return words


def _infer(wav, repo):
    proc, model = _load(repo)
    inputs = proc(wav, sampling_rate=SR, return_tensors="pt").to(DEVICE)
    with torch.no_grad():
        probs = model(**inputs).logits[0].float().softmax(-1)
    best, ids = probs.max(-1)
    return proc.decode(ids), _words(ids.tolist(), best.tolist(), proc)


_transcribe = gpu_task(duration=30)(_infer)


@lru_cache(maxsize=64)
def transcript(path: str) -> str:
    """Text of a clip, for models that need the transcript of their reference. Call it inside a GPU task."""
    return _infer(audio.read(path, SR, MAX_SECONDS), MODELS_JUDGE)[0]


def _norm(text: str) -> str:
    text = "".join(c for c in unicodedata.normalize("NFC", text.lower()) if not unicodedata.category(c).startswith("P"))
    return " ".join(text.split())


def cer(ref: str, hyp: str) -> float:
    """Character error rate (%) after lowercasing and removing punctuation."""
    ref, hyp = _norm(ref), _norm(hyp)
    if not ref:
        return 0.0
    row = list(range(len(hyp) + 1))
    for i, r in enumerate(ref, 1):
        prev, row[0] = row[0], i
        for j, h in enumerate(hyp, 1):
            prev, row[j] = row[j], min(row[j] + 1, row[j - 1] + 1, prev + (r != h))
    return round(100 * row[-1] / len(ref), 2)


def loopback(path: str, text: str) -> dict:
    """Judge 1 transcribes a synthetic clip; its CER against the input text flags unintelligible output."""
    heard = run(path, "w2v-bert")["text"]
    return {"judge": MODELS_JUDGE, "judge_text": heard, "judge_cer": cer(text, heard)}


def run(path: str, model_id: str) -> dict:
    m = registry.get(model_id, "asr")
    wav = audio.read(path, SR, MAX_SECONDS)
    if len(wav) < SR // 4:
        raise ValueError("The recording is too short.")
    t0 = time.perf_counter()
    text, words = _transcribe(wav, m.repo)
    return {"text": text, "words": words, "seconds": round(len(wav) / SR, 2),
            "elapsed": round(time.perf_counter() - t0, 2)}
