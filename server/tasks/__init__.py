"""Importing a task module registers it. Add a task: create a package here, register a Task and its
Models, expose `run(...)`, then add its endpoint in app.py and its page in web/src/tasks."""
from .. import registry
from ..registry import Task
from . import asr, tts  # noqa: F401

for t in [
    Task("mt", "Mooré-French translation", "Translate text between Mooré and French.", "soon"),
    Task("st", "Speech translation", "Speak Mooré, read French.", "soon"),
    Task("s2st", "Speech-to-speech", "Speak one language, hear the other.", "soon"),
    Task("assistant", "Voice assistant", "Talk with an assistant in Mooré.", "soon"),
]:
    registry.task(t)
