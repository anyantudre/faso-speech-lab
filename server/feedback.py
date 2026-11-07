"""Feedback on runs, saved under `feedback/` in the private project dataset.

Two kinds of row, both pointing to runs in `usage/` (text, audio, model, voice, judge CER):
- a vote on one run: up or down, tags, and for ASR an optional corrected transcript, flagged
  `verified: false` until someone reviews it;
- a pair: two takes of the same text, voice and model (different seeds) and which one is better.
  These are the rows preference tuning (DPO, RL) can use.

Votes come from self-selected visitors: keep them apart from the "Rate the voices" study."""
from typing import Literal

from pydantic import BaseModel, Field, model_validator

from .hublog import HubLog, now

TAGS = {
    "tts": {"natural", "clear", "mispronounced", "skipped_word", "wrong_tone", "robotic", "noise", "rhythm",
            "cut_off", "wrong_voice"},
    "asr": {"correct", "wrong_words", "missing_words", "extra_words", "spelling"},
}
RUN = "^[0-9a-f]{12}$"
LOG = HubLog("feedback")


class Vote(BaseModel):
    run: str = Field(pattern=RUN)
    task: Literal["tts", "asr"]
    model: str = Field(max_length=32)
    vote: Literal["up", "down"] | None = None
    run_b: str | None = Field(None, pattern=RUN)
    winner: Literal["a", "b", "tie"] | None = None
    tags: list[str] = Field(default_factory=list, max_length=8)
    correction: str = Field("", max_length=2000)
    native: bool | None = None
    rater: str = Field(min_length=8, max_length=64)

    @model_validator(mode="after")
    def one_kind(self):
        if (self.vote is None) == (self.winner is None) or (self.winner is not None) != (self.run_b is not None):
            raise ValueError("send either a vote on one run, or a winner between two runs")
        return self


def save(v: Vote):
    row = v.model_dump() | {"kind": "pair" if v.winner else "vote", "ts": now(),
                            "tags": [t for t in v.tags if t in TAGS[v.task]]}
    if v.task == "asr" and v.correction.strip():
        row |= {"correction": " ".join(v.correction.split()), "verified": False}
    else:
        row["correction"] = ""
    LOG.write(lambda _: [row])
