"""Open "Rate the voices" test: blind rounds over the clips in `stimuli/`, answers in `ratings/`, both in
the private project dataset.

Pilot, open-web data (`source: "open_web"`), never pooled with the formal listening test. Rows follow
the moore_tts listening-test schema so its analysis can read them with a filter. There are no real
recordings in the rounds, so scores are relative between systems.

Volunteers give their name and email once. They go to `participants/`, apart from the answers, which only carry a
random participant id; results are only published as aggregates."""
import json
import os
import random
import re
import time
from pathlib import Path

from pydantic import BaseModel, Field

from .hublog import REPO, HubLog, now

STIMULI = os.environ.get("STIMULI", "")  # a local folder, for development
APP_VERSION = "1"
PER_ROUND = 3
LOG = HubLog("ratings")
PEOPLE = HubLog("participants")
EMAIL = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")
_loaded: tuple[Path, dict, dict] | None = None
_tried = 0.0


def stimuli() -> tuple[Path, dict, dict] | None:
    """(root, clips by id, items by id), or None while no clips are published (retried every 10 min)."""
    global _loaded, _tried
    if _loaded or time.monotonic() - _tried < 600:
        return _loaded
    _tried = time.monotonic()
    _loaded = _load()
    return _loaded


def _jsonl(path: Path) -> list[dict]:
    return [json.loads(x) for x in path.read_text(encoding="utf-8").splitlines() if x]


def _load() -> tuple[Path, dict, dict] | None:
    from huggingface_hub import snapshot_download

    from .runtime import TOKEN

    try:
        if STIMULI:
            root = Path(STIMULI)
        elif REPO:
            snap = snapshot_download(REPO, repo_type="dataset", allow_patterns="stimuli/**", token=TOKEN)
            root = Path(snap) / "stimuli"
        else:
            return None
        clips = {c["stim"]: c for c in _jsonl(root / "manifest.jsonl")}
        items = {s["item"]: s | {"stims": []} for s in _jsonl(root / "sentences.jsonl")}
    except (OSError, ValueError, KeyError):  # not published yet, or unreadable
        return None
    for c in clips.values():
        items[c["item"]]["stims"].append(c["stim"])
    items = {k: v for k, v in items.items() if len(v["stims"]) >= 2}
    return (root, clips, items) if items else None


def reload():
    global _loaded, _tried
    _loaded, _tried = None, 0.0


def clip_path(stim: str) -> Path | None:
    s = stimuli()
    return s[0] / s[1][stim]["file"] if s and stim in s[1] else None


def new_round(skip: set[str]) -> dict | None:
    s = stimuli()
    if s is None:
        return None
    _, _, items = s
    item = random.choice([i for i in items if i not in skip] or list(items))
    stims = random.sample(items[item]["stims"], min(PER_ROUND, len(items[item]["stims"])))
    return {"item": item, "text": items[item]["text"], "stims": stims}


class Answer(BaseModel):
    tid: str = Field(max_length=32)
    part: str = Field(pattern="^(profile|mos|pick|end)$")
    item: str = Field("", max_length=64)
    stims: list[str] = Field(default_factory=list, max_length=PER_ROUND)
    response: dict = Field(default_factory=dict)
    played_full: bool = False
    position: str = Field("", max_length=8)


class Batch(BaseModel):
    participant: str = Field(min_length=8, max_length=64)
    session_id: str = Field(min_length=8, max_length=64)
    answers: list[Answer] = Field(min_length=1, max_length=8)


def _row(b: Batch, a: Answer, clips: dict) -> dict:
    if any(st not in clips for st in a.stims):
        raise ValueError("unknown clip")
    response = a.response
    if a.part == "mos":
        score = response.get("score")
        if len(a.stims) != 1 or not isinstance(score, int) or not 1 <= score <= 5:
            raise ValueError("a score is one clip rated 1 to 5")
        response = {"score": score}
    elif a.part == "pick":
        if response.get("best") not in a.stims:
            raise ValueError("pick one of the clips shown")
        response = {"best": clips[response["best"]]["system"]}
    elif a.part == "profile":
        response = {k: str(response.get(k, ""))[:60] for k in ("fluent", "region", "headphones")}
    else:
        response = {}
    first = clips[a.stims[0]] if a.stims else {}
    return {"participant": b.participant, "session_id": b.session_id, "ts": now(), "app_version": APP_VERSION,
            "source": "open_web", "tid": a.tid, "part": a.part, "kind": "main", "item": a.item,
            "systems": [clips[st]["system"] for st in a.stims], "stims": a.stims, "response": response,
            "played_full": a.played_full, "position": a.position, "voice": first.get("voice", ""),
            "seed": first.get("seed", 0)}


def save(batch: Batch):
    s = stimuli()
    clips = s[1] if s else {}
    people = [{"participant": batch.participant, "name": " ".join(str(a.response.get("name", "")).split())[:80],
               "email": str(a.response.get("email", "")).strip()[:120], "ts": now()}
              for a in batch.answers if a.part == "profile"]
    if any(len(p["name"]) < 2 or not EMAIL.fullmatch(p["email"]) for p in people):
        raise ValueError("Please enter your name and email address.")
    rows = [_row(batch, a, clips) for a in batch.answers]
    LOG.write(lambda _: rows)
    if people:
        PEOPLE.write(lambda _: people)
