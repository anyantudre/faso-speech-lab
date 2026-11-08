"""Usage history: every run under `usage/` in the private project dataset.

A visitor's own audio (an ASR recording, a cloning reference) is kept only when they tick the box that
allows it; otherwise the row keeps the text, model and timing without the file."""
import json
import uuid

from .hublog import HubLog, now

LOG = HubLog("usage")
APP_VERSION = "1"


def new_id() -> str:
    return uuid.uuid4().hex[:12]


def record(run: str, task: str, model: str, audio: str | None, *, reference: str | None = None, **fields):
    # Each model has its own settings; as JSON text they fit one column in the dataset viewer.
    if "settings" in fields:
        fields["settings"] = json.dumps(fields["settings"], ensure_ascii=False)
    LOG.write(lambda log: [{
        "run": run, "file_name": log.copy(audio, run), "reference": log.copy(reference, f"{run}-ref"),
        "time": now(), "task": task, "model": model, "app_version": APP_VERSION} | fields])
