import pytest
from fastapi.testclient import TestClient

import app
from server import registry, tasks

client = TestClient(app.server)


def test_catalog_lists_tasks_models_and_benchmark():
    data = client.get("/api/catalog").json()
    tasks_by_id = {t["id"]: t for t in data["tasks"]}
    assert tasks_by_id["tts"]["status"] == "live" and tasks_by_id["mt"]["status"] == "soon"
    models = {m["id"]: m for m in data["models"]}
    assert models["kokoro"]["available"] and models["kokoro"]["default"]
    assert models["omnivoice"]["available"] == registry.runnable(registry.MODELS["omnivoice"], data["gpu"])
    assert any(r.get("reference") for r in data["benchmark"]["rows"])


def test_every_model_belongs_to_a_live_task():
    for m in registry.MODELS.values():
        assert registry.TASKS[m.task].status == "live"


def test_unknown_api_path_is_404_not_the_web_app():
    assert client.get("/api/nope").status_code == 404


@pytest.mark.parametrize("text,model,voice,msg", [
    ("  ", "kokoro", "V04", "Type some"),
    ("a" * 501, "kokoro", "V04", "under 500"),
    ("Laafi bala?", "kokoro", "V99", "Unknown voice"),
    ("Laafi bala?", "w2v-bert", "V04", "unknown tts model"),
    ("Laafi bala?", "pocket", "nope", "reference voice"),
    ("Laafi bala?", "omnivoice", "samples/1_reference.flac", "needs a GPU"),
])
def test_tts_rejects_bad_input_before_loading_a_model(text, model, voice, msg):
    with pytest.raises(ValueError, match=msg):
        tasks.tts.run(text, model, voice, 1.0, None, "")


def test_usage_rows_carry_their_audio(tmp_path, monkeypatch):
    import json
    import threading
    import types

    from server import usage

    clip = tmp_path / "clip.wav"
    clip.write_bytes(b"RIFF")
    log = usage.LOG
    monkeypatch.setattr(log, "repo", "user/space-usage")
    monkeypatch.setattr(log, "dir", tmp_path / "run")
    monkeypatch.setattr(log, "scheduler", types.SimpleNamespace(lock=threading.Lock()))
    (tmp_path / "run").mkdir()
    usage.record("0123456789ab", "tts", "kokoro", str(clip), text="Laafi bala?", voice="V04", seconds=1.2)
    row = json.loads((tmp_path / "run" / "metadata.jsonl").read_text(encoding="utf-8"))
    assert row["task"] == "tts" and row["text"] == "Laafi bala?" and row["reference"] == ""
    assert (tmp_path / "run" / row["file_name"]).read_bytes() == b"RIFF"


@pytest.fixture
def clips(tmp_path, monkeypatch):
    import sys
    import threading
    import types

    sys.path.insert(0, "scripts")
    import stimuli as publish

    from server import ratings

    src = tmp_path / "src"
    for system in ("kokoro", "pocket", "mms"):
        (src / system).mkdir(parents=True)
        for item in ("s1", "s2"):
            (src / system / f"{item}.wav").write_bytes(b"RIFF")
    rows = "item\ttext\tvoice\ns1\tLaafi bala?\tV04\ns2\tNe y windga.\tV05\n"
    (src / "sentences.tsv").write_text(rows, encoding="utf-8")
    out = tmp_path / "out"
    assert publish.build(src, out) == 6
    monkeypatch.setattr(ratings, "STIMULI", str(out))
    ratings.reload()
    rows = []
    monkeypatch.setattr(ratings.LOG, "repo", "user/space-ratings")
    monkeypatch.setattr(ratings.LOG, "scheduler", types.SimpleNamespace(lock=threading.Lock()))
    monkeypatch.setattr(ratings.LOG, "write", lambda make: rows.extend(make(ratings.LOG)))
    yield ratings, rows
    ratings.reload()


def test_round_hides_systems_and_skips_seen_items(clips):
    r = client.get("/api/rate/round", params={"skip": "s1"}).json()
    assert r["item"] == "s2" and len(r["stims"]) == 3 and "system" not in str(r)
    assert client.get(f"/api/rate/clip/{r['stims'][0]}").status_code == 200


def test_answers_are_stored_with_the_hidden_systems(clips):
    ratings, rows = clips
    r = ratings.new_round(set())
    base = {"participant": "p-12345678", "session_id": "s-12345678"}
    ok = client.post("/api/rate", json=base | {"answers": [
        {"tid": "mos-1", "part": "mos", "item": r["item"], "stims": r["stims"][:1], "response": {"score": 4},
         "played_full": True},
        {"tid": "pick-1", "part": "pick", "item": r["item"], "stims": r["stims"], "response": {"best": r["stims"][1]}},
    ]})
    assert ok.status_code == 200
    systems = {c["stim"]: c["system"] for c in ratings.stimuli()[1].values()}
    assert rows[0]["systems"] == [systems[r["stims"][0]]] and rows[0]["source"] == "open_web"
    assert rows[1]["response"] == {"best": systems[r["stims"][1]]}
    bad = client.post("/api/rate", json=base | {"answers": [
        {"tid": "mos-2", "part": "mos", "item": r["item"], "stims": r["stims"][:1], "response": {"score": 9}}]})
    assert bad.status_code == 422


def test_names_are_kept_apart_from_answers(clips, monkeypatch):
    ratings, rows = clips
    people = []
    monkeypatch.setattr(ratings.PEOPLE, "write", lambda make: people.extend(make(ratings.PEOPLE)))
    base = {"participant": "p-12345678", "session_id": "s-12345678"}
    profile = {"fluent": "native", "region": "Kaya", "headphones": "headphones"}
    answer = {"tid": "profile", "part": "profile", "response": profile}
    no_name = client.post("/api/rate", json=base | {"answers": [answer]})
    assert no_name.status_code == 422 and not rows
    ok = client.post("/api/rate", json=base | {"answers": [
        answer | {"response": profile | {"name": "  Awa   Ouedraogo ", "email": "awa@univ-ouaga.bf"}}]})
    assert ok.status_code == 200
    assert people == [{"participant": "p-12345678", "name": "Awa Ouedraogo", "email": "awa@univ-ouaga.bf",
                       "ts": people[0]["ts"]}]
    assert "name" not in rows[0]["response"] and "Awa" not in str(rows) and "@" not in str(rows)


def test_feedback_keeps_known_tags_and_asr_corrections(monkeypatch):
    from server import feedback

    rows = []
    monkeypatch.setattr(feedback.LOG, "write", lambda make: rows.extend(make(feedback.LOG)))
    vote = {"run": "0123456789ab", "task": "tts", "model": "kokoro", "vote": "down", "rater": "r-12345678",
            "tags": ["robotic", "made_up"], "correction": "ignored for tts"}
    assert client.post("/api/feedback", json=vote).status_code == 200
    assert rows[0]["tags"] == ["robotic"] and rows[0]["correction"] == "" and rows[0]["kind"] == "vote"
    asr = vote | {"task": "asr", "model": "w2v-bert", "tags": ["wrong_words"], "correction": " Ne  y windga. "}
    assert client.post("/api/feedback", json=asr).status_code == 200
    assert rows[1]["correction"] == "Ne y windga." and rows[1]["verified"] is False
    assert client.post("/api/feedback", json=vote | {"run": "../../etc"}).status_code == 422
    pair = {k: v for k, v in vote.items() if k != "vote"}
    pair |= {"run_b": "ba9876543210", "winner": "b", "tags": ["natural"]}
    assert client.post("/api/feedback", json=pair).status_code == 200 and rows[2]["kind"] == "pair"
    assert client.post("/api/feedback", json=pair | {"vote": "up"}).status_code == 422


def test_cer_ignores_case_and_punctuation():
    assert tasks.asr.cer("Laafi bala?", "laafi bala") == 0.0
    assert tasks.asr.cer("abcd", "abxd") == 25.0
