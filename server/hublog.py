"""Append-only JSON-lines logs pushed every few minutes to the private project dataset `<space id>-data`.

Each log has its own folder there (`usage/`, `ratings/`, `participants/`, `feedback/`). Rows land in
`<folder>/runs/<process>/metadata.jsonl` next to any files they carry, so the dataset viewer plays the
audio. Writes never raise: a logging failure must not break a visitor's run."""
import json
import logging
import os
import shutil
import tempfile
import uuid
from datetime import UTC, datetime
from pathlib import Path

from .runtime import TOKEN

log = logging.getLogger(__name__)

SPACE = os.environ.get("SPACE_ID", "")
REPO = os.environ.get("DATA_REPO", f"{SPACE}-data" if SPACE else "")
PROCESS = f"{datetime.now(UTC):%Y%m%d-%H%M%S}-{uuid.uuid4().hex[:6]}"


def now() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")


class HubLog:
    def __init__(self, name: str):
        """Logs to `<REPO>/<name>/`; off outside a Space unless `DATA_REPO` is set."""
        self.repo, self.name = REPO, name
        self.folder = Path(tempfile.gettempdir()) / f"faso-speech-lab-{name}"
        self.dir = self.folder / "runs" / PROCESS
        self.scheduler = None

    def copy(self, src: str | None, stem: str) -> str:
        """Copies a file next to the rows and returns its name; call inside `write`'s lock."""
        if not src:
            return ""
        name = f"{stem}{Path(src).suffix or '.wav'}"
        shutil.copyfile(src, self.dir / name)
        return name

    def write(self, make_rows):
        """`make_rows(self)` returns the rows; it runs under the upload lock so copied files and rows
        are pushed together."""
        if not self.repo:
            return
        try:
            if self.scheduler is None:
                from huggingface_hub import CommitScheduler

                self.dir.mkdir(parents=True, exist_ok=True)
                self.scheduler = CommitScheduler(repo_id=self.repo, repo_type="dataset", folder_path=self.folder,
                                                 path_in_repo=self.name, every=5, private=True, token=TOKEN)
            with self.scheduler.lock, (self.dir / "metadata.jsonl").open("a", encoding="utf-8") as f:
                for row in make_rows(self):
                    f.write(json.dumps(row, ensure_ascii=False) + "\n")
        except Exception:
            log.exception("hub log %s failed", self.repo)
