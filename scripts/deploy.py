"""Upload the server code and the built web app to the Hugging Face Space, in one commit.

The Space gets its own short README with the configuration Hugging Face reads; the GitHub README
stays free of it."""
import os
from pathlib import Path

from huggingface_hub import CommitOperationAdd, CommitOperationDelete, HfApi

FILES = ["app.py", "requirements.txt", "assets/brand/*", "server/**/*", "web/dist/**/*"]
MANAGED = ("server/", "web/dist/", "assets/")
CARD = """---
title: FasoSpeech Lab
colorFrom: blue
colorTo: gray
sdk: gradio
sdk_version: 6.31.0
python_version: "3.12"
app_file: app.py
pinned: false
license: apache-2.0
short_description: Open research lab for Mooré speech models
---

Independent, non-commercial research on speech technology for Mooré.
Code and documentation: https://github.com/anyantudre/faso-speech-lab
"""


def main():
    space, api = os.environ["SPACE_ID"], HfApi(token=os.environ["HF_TOKEN"])
    local = sorted({p.as_posix() for pattern in FILES for p in Path().glob(pattern)
                    if p.is_file() and "__pycache__" not in p.parts})
    stale = [f for f in api.list_repo_files(space, repo_type="space") if f.startswith(MANAGED) and f not in local]
    ops = [CommitOperationAdd(f, f) for f in local] + [CommitOperationAdd("README.md", CARD.encode())]
    ops += [CommitOperationDelete(f) for f in stale]
    api.create_commit(space, ops, repo_type="space",
                      commit_message=f"Deploy {os.environ.get('GITHUB_SHA', 'local')[:7]}")


if __name__ == "__main__":
    main()
