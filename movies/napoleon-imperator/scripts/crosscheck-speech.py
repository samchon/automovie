"""Independently transcribe only two ambiguous candidate takes on local CPU.

The original tiny-model inspection and audio remain read-only. This separate
base-model observation does not replace listening, pronunciation or acting review.
Expected words are retained for comparison after decoding and never enter ASR.
"""

import argparse
import hashlib
import importlib.metadata
import json
import time
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
from huggingface_hub import snapshot_download
from scipy.signal import resample_poly
from transformers import pipeline


def digest(data: bytes) -> str:
    """Identify the exact retained source, diagnostic, index or audio bytes."""
    return hashlib.sha256(data).hexdigest()


def write_reports(root: Path, report: dict) -> None:
    """Retain this observation and any failure without publishing acceptance."""
    folder = root / "docs/production"
    (folder / "speech-crosscheck.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    rows = []
    for take in report["takes"]:
        observed = take.get("asr", {}).get("text", take.get("error", "Not decoded"))
        rows.append(f"| {take['id']} | {take['tiny']['asr']['text'].strip()} | {observed.strip()} |")
    text = "\n".join([
        "# Two-take speech cross-check", "",
        "This separate local ASR observation examines only `line-016` and "
        "`line-026` from the unchanged candidates. It preserves the original "
        "[tiny-model inspection](speech-diagnostics.md). Neither recognizer "
        "establishes the intended pronunciation or acting, and a larger model "
        "does not supply listening acceptance. Both takes remain `candidate-unheard`.", "",
        f"Run: `{report['createdUtc']}`. Complete: `{report['complete']}`. "
        f"Model: `{report['model']['repository']}` at "
        f"`{report['model']['snapshot']}`. Device: CPU, threads: {report['parameters']['threads']}.", "",
        "Source, index, original inspection and WAV digests are verified before "
        "decoding and checked again afterward. Expected text, captions, prior "
        "transcripts and prompts are never supplied to the recognizer. Each "
        "whole untrimmed waveform is resampled to 16 kHz in memory.", "",
        "| Take | Existing tiny recognition | Independent base recognition |",
        "| --- | --- | --- |", *rows, "",
        "The [raw report](speech-crosscheck.json) preserves exact model revisions, "
        "versions, decoder parameters, word timestamps relative to each original "
        "take, input identities, failed attempts and any previous cross-checks. "
        "Timestamps are ASR estimates; zero-length or inaccurate word boundaries "
        "remain possible. The recognition results are observations, not corrected dialogue.", "",
        f"Setup failure: `{report.get('setupError', 'none')}`.", "",
        "Run in the adopted isolated runtime with its existing `HF_HOME`: "
        "`python scripts/crosscheck-speech.py --threads 4`. This script writes "
        "only these two cross-check reports and does not regenerate audio.", "",
        "Reference: [official base-model card](https://huggingface.co/openai/whisper-base.en).", ""])
    (folder / "speech-crosscheck.md").write_text(text, encoding="utf-8")


def main() -> None:
    """Verify the exact two existing takes, then decode them without text hints.

    All original inputs remain read-only. Setup and per-take failures are retained
    as incomplete observations. The CPU thread limit is at most four; the official
    model uses the existing local Hub cache and performs no audio upload.
    """
    parser = argparse.ArgumentParser()
    parser.add_argument("--threads", type=int, default=4, choices=range(1, 5))
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    directory = root / "public/audio/001-road"
    index_path = directory / "takes.json"
    diagnostic_path = root / "docs/production/speech-diagnostics.json"
    index_bytes, diagnostic_bytes = index_path.read_bytes(), diagnostic_path.read_bytes()
    index, diagnostic = json.loads(index_bytes), json.loads(diagnostic_bytes)
    source_path = root / index["source"]
    source = source_path.read_bytes()
    if (digest(source) != index["sourceSha256"]
            or digest(source) != diagnostic["sourceSha256"]
            or digest(index_bytes) != diagnostic["indexSha256"]
            or not diagnostic["complete"]):
        raise ValueError("Original source, candidate index or tiny inspection identity differs")
    ids = ("line-016", "line-026")
    takes = {take["id"]: take for take in index["takes"]}
    prior = {take["id"]: take for take in diagnostic["takes"]}
    inputs = []
    for identity in ids:
        take = takes[identity]
        if (Path(take["file"]).name != take["file"] or take["sha256"] != prior[identity]["sha256"]
                or take["text"] != prior[identity]["text"]):
            raise ValueError(f"Candidate identity differs: {identity}")
        filename = directory / take["file"]
        actual_bytes = filename.read_bytes()
        if digest(actual_bytes) != take["sha256"]:
            raise ValueError(f"Audio digest differs: {identity}")
        info = sf.info(filename)
        audio, rate = sf.read(filename, dtype="float64")
        if (rate != 48000 or info.channels != 1 or info.subtype != "PCM_16"
                or len(audio) != take["frames"] or not np.isfinite(audio).all()):
            raise ValueError(f"Actual audio format differs: {identity}")
        source_line = source.decode("utf-8").splitlines()[take["sourceLine"] - 1]
        if source_line != f"{take['speaker']}: {take['text']}":
            raise ValueError(f"Current manuscript line differs: {identity}")
        inputs.append((take, audio, rate, filename))
    torch.set_num_threads(args.threads)
    torch.set_num_interop_threads(1)
    report = {
        "createdUtc": datetime.now(timezone.utc).isoformat(), "complete": False,
        "source": index["source"], "sourceSha256": digest(source),
        "indexSha256": digest(index_bytes), "tinyDiagnosticSha256": digest(diagnostic_bytes),
        "inputTakeIds": list(ids), "allInputIdentitiesVerified": True,
        "acceptance": "candidate-unheard",
        "model": {"repository": "openai/whisper-base.en", "snapshot": None,
                  "versions": {name: importlib.metadata.version(name)
                               for name in ["transformers", "torch", "scipy", "soundfile"]}},
        "parameters": {"threads": args.threads, "device": "cpu", "dtype": "float32",
                       "resampling": "scipy.signal.resample_poly", "sampleRate": 16000,
                       "chunkLengthSeconds": None, "returnTimestamps": "word",
                       "expectedTextPrompt": False, "priorTranscriptPrompt": False,
                       "generate": {"do_sample": False, "num_beams": 1,
                                    "condition_on_prev_tokens": False}},
        "takes": []}
    previous_path = root / "docs/production/speech-crosscheck.json"
    if previous_path.exists():
        previous = json.loads(previous_path.read_text(encoding="utf-8"))
        history = previous.pop("previousCrosschecks", [])
        report["previousCrosschecks"] = [*history, previous]
    try:
        model_path = snapshot_download(report["model"]["repository"],
                                       allow_patterns=["*.json", "*.txt", "*.safetensors"])
        report["model"]["snapshot"] = Path(model_path).name
        recognizer = pipeline("automatic-speech-recognition", model=model_path,
                              device="cpu", dtype=torch.float32)
    except Exception as error:
        report["setupError"] = f"{type(error).__name__}: {error}"
        write_reports(root, report)
        raise SystemExit(1)
    failures = 0
    for take, audio, rate, filename in inputs:
        item = {key: take[key] for key in ["id", "speaker", "text", "file", "sha256", "sourceLine"]}
        item.update({"sampleRate": rate, "frames": len(audio), "duration": len(audio) / rate,
                     "tiny": {"model": diagnostic["model"], "asr": prior[take["id"]]["asr"]}})
        start = time.monotonic()
        try:
            resampled = resample_poly(audio, 1, 3).astype(np.float32)
            with torch.inference_mode():
                item["asr"] = recognizer({"array": resampled, "sampling_rate": 16000},
                                         return_timestamps="word",
                                         generate_kwargs=report["parameters"]["generate"])
        except Exception as error:
            failures += 1
            item["error"] = f"{type(error).__name__}: {error}"
        item["elapsedSeconds"] = time.monotonic() - start
        report["takes"].append(item)
        print(json.dumps(item, ensure_ascii=False), flush=True)
        write_reports(root, report)
    unchanged = (digest(index_path.read_bytes()) == report["indexSha256"]
                 and digest(source_path.read_bytes()) == report["sourceSha256"]
                 and digest(diagnostic_path.read_bytes()) == report["tinyDiagnosticSha256"]
                 and all(digest(filename.read_bytes()) == take["sha256"]
                         for take, _, _, filename in inputs))
    report["inputsUnchangedAfterRun"] = unchanged
    report["failedTakeCount"] = failures
    report["complete"] = failures == 0 and unchanged
    write_reports(root, report)
    if not report["complete"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
