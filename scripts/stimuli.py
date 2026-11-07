"""Publish the clips of the "Rate the voices" test to `stimuli/` in the private project dataset.

Input folder:
    sentences.tsv          item, text, voice (header row, tab separated)
    <system>/<item>.wav    one clip per system and sentence, already normalised

Clip names are salted hashes, so the browser cannot tell which system made a clip; the mapping
lives only in the private dataset's manifest.

    python scripts/stimuli.py <folder> [--repo anyantudre/faso-speech-lab-data] [--dry-run]
"""
import argparse
import csv
import hashlib
import json
import os
import secrets
import shutil
import tempfile
from pathlib import Path

SYSTEMS = ["kokoro", "omnivoice", "chatterbox", "spark", "f5", "pocket", "mms"]


def build(src: Path, out: Path) -> int:
    with (src / "sentences.tsv").open(encoding="utf-8") as f:
        sentences = list(csv.DictReader(f, delimiter="\t"))
    salt = secrets.token_hex(16)
    (out / "clips").mkdir(parents=True)
    manifest = []
    for s in sentences:
        for system in SYSTEMS:
            wav = src / system / f"{s['item']}.wav"
            if not wav.is_file():
                continue
            stim = hashlib.sha256(f"{salt}/{system}/{s['item']}".encode()).hexdigest()[:16]
            shutil.copyfile(wav, out / "clips" / f"{stim}.wav")
            manifest.append({"stim": stim, "system": system, "item": s["item"], "voice": s["voice"],
                             "seed": 0, "file": f"clips/{stim}.wav"})
    for name, rows in [("manifest.jsonl", manifest), ("sentences.jsonl", sentences)]:
        (out / name).write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows), encoding="utf-8")
    return len(manifest)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("folder", type=Path)
    p.add_argument("--repo", default="anyantudre/faso-speech-lab-data")
    p.add_argument("--dry-run", action="store_true", help="build in a temp folder and print its path")
    a = p.parse_args()
    out = Path(tempfile.mkdtemp()) / "stimuli"
    n = build(a.folder, out)
    print(f"{n} clips in {out}")
    if a.dry_run:
        return
    from huggingface_hub import HfApi

    api = HfApi(token=os.environ["HF_TOKEN"])
    api.create_repo(a.repo, repo_type="dataset", private=True, exist_ok=True)
    api.upload_folder(repo_id=a.repo, repo_type="dataset", folder_path=out, path_in_repo="stimuli",
                      delete_patterns=["clips/**"], commit_message=f"{n} rating clips")
    print(f"https://huggingface.co/datasets/{a.repo}")


if __name__ == "__main__":
    main()
