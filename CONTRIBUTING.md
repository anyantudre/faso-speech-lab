# Contributing to FasoSpeech Lab

Thank you for your interest. This lab exists to make speech technology for Mooré, and later the other languages of Burkina Faso, easier to try and to improve. Contributions of any size are welcome:

- report a bug or a wrong pronunciation in an issue,
- suggest an idea for the interface or a new task,
- improve the code, the texts or the French translation,
- add a model or a task (see "How it works" in the README).

Before opening a pull request, check that the tests and linters pass:

```bash
pytest
ruff check .
cd web && npm run lint && npm run build
```

When you open a pull request, GitHub fills in a short template: a title in the imperative under 60 characters, a one or two sentence summary, the changes, and how you tested them.

The models are under CC BY-NC 4.0, so any work built on them stays non-commercial. Please never use the lab to clone someone's voice without their consent.
