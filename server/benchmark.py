"""MooreSpeechBench v1.0, TTS results: CER (%) of the ASR judge on synthetic speech.
Source: anyantudre/MooreSpeechBench and the model cards."""

DATASET = "anyantudre/MooreSpeechBench"
HOURS = 54.6

ROWS = [
    {"id": "real", "name": "Real recordings", "test": 0.54, "test_unseen": 0.73, "reference": True},
    {"id": "kokoro", "name": "Kokoro 82M", "test": 0.38, "test_unseen": 0.43},
    {"id": "omnivoice", "name": "OmniVoice", "test": 0.90, "test_unseen": 1.07},
    {"id": "chatterbox", "name": "Chatterbox", "test": 1.30, "test_unseen": 1.44},
    {"id": "spark", "name": "Spark-TTS 0.5B", "test": 1.55, "test_unseen": 1.50},
    {"id": "pocket", "name": "Pocket TTS", "test": 1.89, "test_unseen": 2.67},
    {"id": "f5", "name": "F5-TTS", "test": 1.95, "test_unseen": 2.33},
]
