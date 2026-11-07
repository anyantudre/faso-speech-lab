"""Faso Speech Lab: Gradio server mode. The web app (web/dist) is served at /, model endpoints live
under /gradio_api and are called from the browser with @gradio/client."""
from server import runtime  # noqa: I001  (imports `spaces` before torch)

import os
import threading
from pathlib import Path

import gradio as gr
from fastapi import Request
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from starlette.exceptions import HTTPException

from server import benchmark, feedback, ratings, registry, tasks, usage

DIST = Path(__file__).parent / "web" / "dist"

server = gr.Server(title="Faso Speech Lab", docs_url=None, redoc_url=None)


def _path(f) -> str | None:
    return (f.get("path") if isinstance(f, dict) else getattr(f, "path", f)) or None


def _later(fn):
    """Runs bookkeeping after the answer is sent; inline on ZeroGPU, where GPU calls need the request."""
    if runtime.ZERO_GPU:
        fn()
    else:
        threading.Thread(target=fn, daemon=True).start()


@server.api(name="tts", concurrency_limit=1)
def tts(text: str, model: str, voice: str, speed: float = 1.0, reference: gr.FileData | None = None,
        reference_text: str = "", seed: int = 0, keep_reference: bool = False, source: str = "typed",
        lang: str = "en") -> dict:
    """Mooré text to speech. Returns the audio file, its length, the time it took and a run id.

    `keep_reference`: the visitor allowed keeping their cloning clip. `source`: typed or example text."""
    out = tasks.tts.run(text, model, voice, speed, _path(reference), reference_text, seed)
    run, repo = usage.new_id(), registry.MODELS[model].repo
    ref = _path(reference) if keep_reference else None

    def save():
        try:
            judged = tasks.asr.loopback(out["audio"], out["text"])
        except Exception:  # noqa: BLE001  (the score is a bonus, the run is still saved)
            judged = {}
        usage.record(run, "tts", model, out["audio"], reference=ref, voice=voice, text=out["text"],
                     text_source=source[:16], lang=lang[:8], repo=repo, revision=runtime.revision(repo),
                     settings=out["settings"], sample_rate=out["sample_rate"], seconds=out["seconds"],
                     elapsed=out["elapsed"], reference_kept=bool(ref), **judged)

    _later(save)
    return {"audio": gr.FileData(path=out["audio"]).model_dump(), "seconds": out["seconds"],
            "elapsed": out["elapsed"], "run": run}


@server.api(name="asr", concurrency_limit=1)
def asr(audio: gr.FileData, model: str = "w2v-bert", keep: bool = False, lang: str = "en") -> dict:
    """Mooré speech to text, with a confidence per word. `keep`: the visitor allowed keeping the audio."""
    out = tasks.asr.run(_path(audio), model)
    run, repo = usage.new_id(), registry.MODELS[model].repo
    _later(lambda: usage.record(run, "asr", model, _path(audio) if keep else None, text=out["text"],
                                lang=lang[:8], repo=repo, revision=runtime.revision(repo),
                                seconds=out["seconds"], elapsed=out["elapsed"], audio_kept=keep))
    return out | {"run": run}


@server.get("/api/catalog")
def catalog():
    return registry.catalog(runtime.HAS_GPU) | {
        "benchmark": {"dataset": benchmark.DATASET, "hours": benchmark.HOURS, "rows": benchmark.ROWS}}


@server.get("/api/sample/{model_id}/{n}")
def sample(model_id: str, n: int):
    """Pre-generated samples from the model card, for models this Space cannot run."""
    m = registry.MODELS.get(model_id)
    if m is None or not 0 <= n < len(m.samples):
        raise HTTPException(404)
    return FileResponse(runtime.hub_file(m.repo, m.samples[n]), media_type="audio/wav")


@server.get("/api/voice/{model_id}/{n}")
def voice(model_id: str, n: int):
    """Reference clips offered as ready-made voices for cloning models."""
    m = registry.MODELS.get(model_id)
    if m is None or not m.cloning or not 0 <= n < len(m.voices):
        raise HTTPException(404)
    return FileResponse(runtime.hub_file(m.repo, m.voices[n]), media_type="audio/flac")


@server.get("/api/rate/round")
def rate_round(skip: str = ""):
    """A blind round: one sentence and 2 or 3 clip ids, systems hidden."""
    r = ratings.new_round(set(skip.split(",")))
    if r is None:
        raise HTTPException(404, "No clips to rate yet.")
    return r


@server.get("/api/rate/clip/{stim}")
def rate_clip(stim: str):
    path = ratings.clip_path(stim)
    if path is None:
        raise HTTPException(404)
    return FileResponse(path, media_type="audio/wav")


@server.post("/api/rate")
def rate(batch: ratings.Batch):
    try:
        ratings.save(batch)
    except ValueError as e:
        raise HTTPException(422, str(e)) from e
    return {"ok": True}


@server.post("/api/feedback")
def give_feedback(vote: feedback.Vote):
    """Thumbs up or down on one run, with optional tags and, for ASR, a corrected transcript."""
    feedback.save(vote)
    return {"ok": True}


@server.get("/", include_in_schema=False)
def index():
    return FileResponse(DIST / "index.html") if DIST.exists() else RedirectResponse("/api/catalog")


@server.exception_handler(404)
async def spa(request: Request, exc: HTTPException):
    """Client-side routes and static assets of the web app."""
    path = request.url.path
    if request.method != "GET" or path.startswith(("/gradio_api", "/api/")) or not DIST.exists():
        return JSONResponse({"detail": "Not found"}, status_code=404)
    f = (DIST / path.lstrip("/")).resolve()
    return FileResponse(f if f.is_file() and DIST.resolve() in f.parents else DIST / "index.html")


def warm_up():
    """Download and load the CPU models once at startup, so the first visitor does not wait for it."""
    speech = tasks.tts.run("Laafi bala?", "kokoro", "V04", 1.0, None, "")
    tasks.asr.run(speech["audio"], "w2v-bert")


if __name__ == "__main__":
    if os.environ.get("SPACE_ID") and not runtime.ZERO_GPU:
        threading.Thread(target=warm_up, daemon=True).start()
    server.launch(server_name="0.0.0.0", show_error=True, footer_links=[])
