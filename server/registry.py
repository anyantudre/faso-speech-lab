"""Tasks and models are plug-ins: a task module registers itself and its models here,
and the web app reads the result from /api/catalog."""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from importlib.util import find_spec
from typing import Literal

Status = Literal["live", "soon"]


@dataclass
class Task:
    id: str
    name: str
    summary: str
    status: Status = "live"


@dataclass
class Model:
    id: str
    task: str
    name: str
    repo: str
    base: str
    summary: str
    device: Literal["cpu", "gpu"] = "cpu"
    cloning: bool = False
    voices: list[str] = field(default_factory=list)
    scores: dict[str, float] = field(default_factory=dict)
    samples: list[str] = field(default_factory=list)
    licence: str = "CC BY-NC 4.0"
    default: bool = False
    needs: str = ""  # Python package the engine imports, if it is not always installed
    sampling: bool = True  # False for deterministic models: another take would be identical


TASKS: dict[str, Task] = {}
MODELS: dict[str, Model] = {}


def task(t: Task) -> Task:
    TASKS[t.id] = t
    return t


def model(m: Model) -> Model:
    MODELS[m.id] = m
    return m


def get(model_id: str, task_id: str) -> Model:
    m = MODELS.get(model_id)
    if m is None or m.task != task_id:
        raise ValueError(f"unknown {task_id} model: {model_id}")
    return m


def runnable(m: Model, gpu: bool) -> bool:
    return (gpu or m.device == "cpu") and (not m.needs or find_spec(m.needs) is not None)


def catalog(gpu: bool) -> dict:
    return {
        "gpu": gpu,
        "tasks": [asdict(t) for t in TASKS.values()],
        "models": [asdict(m) | {"available": runnable(m, gpu)} for m in MODELS.values()],
    }
