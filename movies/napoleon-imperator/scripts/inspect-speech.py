"""Inspect exact candidate audio locally without granting listening acceptance.

Run with the adopted isolated Python runtime. The ASR model downloads from its
official Hub repository; audio never leaves this process. Expected dialogue is
used only after decoding, for diagnostics, and is never a model prompt. Word
timestamps are model estimates relative to each original untrimmed take.
"""

import argparse
import difflib
import hashlib
import importlib.metadata
import json
import math
import re
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
    """Identify the exact source or audio bytes consumed by this inspection."""
    return hashlib.sha256(data).hexdigest()


def tokens(text: str) -> list[str]:
    """Ignore punctuation and case while preserving lexical differences."""
    return re.findall(r"[^\W_]+(?:'[^\W_]+)?", text.lower().replace("’", "'"))


def compare(expected: str, observed: str, chunks: list[dict]) -> dict:
    """Expose token edit distance and differing spans without declaring failure.

    ASR substitutions, especially names, are candidates for listening. Span times
    cover overlapping recognized words, not independently verified phonemes.
    """
    left, right = tokens(expected), tokens(observed)
    costs = list(range(len(right) + 1))
    for i, word in enumerate(left, 1):
        current = [i]
        for j, other in enumerate(right, 1):
            current.append(min(current[-1] + 1, costs[j] + 1,
                               costs[j - 1] + (word != other)))
        costs = current
    timed = []
    for chunk in chunks:
        timed.extend([chunk.get("timestamp")] * len(tokens(chunk["text"])))
    spans = []
    for operation, a, b, c, d in difflib.SequenceMatcher(
            None, left, right, autojunk=False).get_opcodes():
        if operation == "equal":
            continue
        times = timed[c:d]
        starts = [item[0] for item in times if item and item[0] is not None]
        ends = [item[1] for item in times if item and item[1] is not None]
        spans.append({"operation": operation, "expectedTokenRange": [a, b],
                      "recognizedTokenRange": [c, d],
                      "expected": " ".join(left[a:b]),
                      "recognized": " ".join(right[c:d]),
                      "recognizedTimeRange": [min(starts), max(ends)]
                      if starts and ends else None})
    return {"expectedWords": len(left), "recognizedWords": len(right),
            "wordEdits": costs[-1], "wordErrorRate": costs[-1] / max(len(left), 1),
            "differenceSpans": spans}


def signal_report(audio: np.ndarray, rate: int) -> dict:
    """Measure untrimmed PCM and low-energy intervals using 20 ms RMS windows.

    A window below -45 dBFS is low energy, not proof of silence or missing words.
    Only contiguous intervals of at least 0.5 s are reported. The final partial
    window is measured at its true length and all times are take-relative seconds.
    """
    step = max(1, round(rate * .02))
    quiet = []
    start = None
    for offset in range(0, len(audio), step):
        segment = audio[offset:offset + step]
        low = float(np.sqrt(np.mean(segment * segment))) < 10 ** (-45 / 20)
        if low and start is None:
            start = offset
        end = min(offset + step, len(audio))
        if start is not None and (not low or end == len(audio)):
            stop = offset if not low else end
            if (stop - start) / rate >= .5:
                quiet.append({"start": start / rate, "end": stop / rate,
                              "position": "leading" if start == 0 else
                              "trailing" if stop == len(audio) else "internal"})
            start = None
    return {"frames": len(audio), "sampleRate": rate,
            "duration": len(audio) / rate,
            "peak": float(np.max(np.abs(audio))),
            "rms": float(np.sqrt(np.mean(audio * audio))),
            "clippedSamples": int(np.sum(np.abs(audio) >= 32767 / 32768)),
            "lowEnergyIntervals": quiet}


def write_reports(root: Path, report: dict) -> None:
    """Publish complete or failed-prefix diagnostics without altering inputs."""
    destination = root / "docs/production"
    destination.mkdir(parents=True, exist_ok=True)
    (destination / "speech-diagnostics.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    rows = []
    for item in report["takes"]:
        comparison = item.get("comparison", {})
        edits = comparison.get("wordEdits", "failed")
        transcript = item.get("asr", {}).get("text", item.get("error", ""))
        transcript = transcript.strip().replace("|", "\\|").replace("\n", " ")
        rows.append(f"| {item['id']} | {item['signal']['duration']:.2f} | {edits} | {transcript} |")
    text = "\n".join([
        "# Episode 1 speech diagnostics", "",
        "This local inspection covers candidate audio, not listening or acting acceptance. "
        "All takes retain `candidate-unheard`. ASR can misrecognize words and its "
        "timestamps are approximate. Lexical differences and low-energy intervals "
        "identify passages to inspect; they do not establish an audio defect.", "",
        f"Run: `{report['createdUtc']}`. Complete: `{report['complete']}`. "
        f"Input population: {report['inputTakeCount']} takes. "
        f"Source SHA-256: `{report['sourceSha256']}`.", "",
        f"Model: `{report['model']['repository']}` at "
        f"`{report['model']['snapshot']}`. CPU threads: {report['parameters']['threads']}. "
        "No expected text, prompt, prior transcript or voice reference is supplied "
        "to the recognizer. Resampling from the saved PCM to 16 kHz occurs only in memory.", "",
        "The [machine-readable report](speech-diagnostics.json) retains every actual "
        "word and take-relative timestamp, digest, measurement, decoding parameter, "
        "difference span and failure. Deletion candidates have no recognized time; "
        "use neighboring recognized words from that report. A 20 ms RMS window "
        "below -45 dBFS contributes to low-energy intervals of at least 0.5 s.", "",
        "Word edits retain homophones such as `corps` / `core` and name spellings; "
        "they are not a pronunciation verdict. Zero-duration word timestamps and "
        "words spanning pauses can occur in Whisper alignment. Previous inspection "
        "results, parameters and limitations are retained in `previousInspections`.", "",
        "| Take | Seconds | Word edits | Raw recognition |", "| --- | ---: | ---: | --- |",
        *rows, "", "References: [model card](https://huggingface.co/openai/whisper-tiny.en), "
        "[Whisper API](https://huggingface.co/docs/transformers/model_doc/whisper).", "",
        "Regenerate this diagnostic with the isolated runtime and its existing "
        "`HF_HOME`: `python scripts/inspect-speech.py --threads 4`. This writes only "
        "the two diagnostic reports; it does not regenerate or adopt audio.", ""])
    (destination / "speech-diagnostics.md").write_text(text, encoding="utf-8")


def main() -> None:
    """Verify all input identities before independent local ASR of all 27 takes.

    Invalid source identity, population, format or byte digests stop before model
    inference. Per-take ASR failures retain raw errors and a failed-prefix report;
    a failed line does not prevent inspection of the rest of the population.
    """
    parser = argparse.ArgumentParser()
    parser.add_argument("--threads", type=int, default=4, choices=range(1, 5))
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    directory = root / "public/audio/001-road"
    index_bytes = (directory / "takes.json").read_bytes()
    index = json.loads(index_bytes)
    source = (root / index["source"]).read_bytes()
    if digest(source) != index["sourceSha256"] or not index.get("complete"):
        raise ValueError("Source identity or candidate-generation completeness differs")
    actual = []
    unit = None
    for number, line in enumerate(source.decode("utf-8").splitlines(), 1):
        heading = re.match(r"## .*\{#([^}]+)\}", line)
        if heading:
            unit = heading.group(1)
        match = re.match(r"^([A-Z][A-Z ]+)(?: \(([^)]+)\))?: (.+)$", line)
        if match:
            actual.append((f"line-{len(actual)+1:03d}", unit, *match.groups(), number))
    if len(actual) != 27 or len(index["takes"]) != 27:
        raise ValueError("Expected complete 27-line episode population")
    report_path = root / "docs/production/speech-diagnostics.json"
    previous = json.loads(report_path.read_text(encoding="utf-8")) if report_path.exists() else None
    inputs = []
    for take, parsed in zip(index["takes"], actual):
        identity = tuple(take[key] for key in
                         ("id", "unit", "speaker", "qualifier", "text", "sourceLine"))
        if identity != parsed or Path(take["file"]).name != take["file"]:
            raise ValueError(f"Dialogue identity or filename differs: {take['id']}")
        filename = directory / take["file"]
        if digest(filename.read_bytes()) != take["sha256"]:
            raise ValueError(f"Audio digest differs: {take['id']}")
        info = sf.info(filename)
        audio, rate = sf.read(filename, dtype="float64")
        if (rate != 48000 or info.channels != 1 or info.subtype != "PCM_16"
                or len(audio) != take["frames"] or len(audio) / rate > 30
                or not np.isfinite(audio).all()):
            raise ValueError(f"Saved audio format differs: {take['id']}")
        inputs.append((take, audio, rate))
    torch.set_num_threads(args.threads)
    torch.set_num_interop_threads(1)
    model_id = "openai/whisper-tiny.en"
    model_path = snapshot_download(model_id, allow_patterns=["*.json", "*.txt", "*.safetensors"])
    recognizer = pipeline("automatic-speech-recognition", model=model_path,
                          device="cpu", dtype=torch.float32)
    generate = {"do_sample": False, "num_beams": 1,
                "condition_on_prev_tokens": False}
    report = {"createdUtc": datetime.now(timezone.utc).isoformat(), "complete": False,
              "source": index["source"], "sourceSha256": digest(source),
              "indexSha256": digest(index_bytes), "inputTakeCount": len(inputs),
              "allInputIdentitiesVerified": True,
              "acceptance": "candidate-unheard",
              "model": {"repository": model_id, "snapshot": Path(model_path).name,
                        "versions": {name: importlib.metadata.version(name)
                                     for name in ["transformers", "torch", "scipy", "soundfile"]}},
              "parameters": {"threads": args.threads, "device": "cpu", "dtype": "float32",
                             "resampling": "scipy.signal.resample_poly", "sampleRate": 16000,
                             "chunkLengthSeconds": None, "strideLengthSeconds": None,
                             "maximumInputSeconds": 30,
                             "returnTimestamps": "word", "expectedTextPrompt": False,
                             "generate": generate}, "takes": []}
    if previous:
        history = previous.pop("previousInspections", [])
        previous.setdefault("limitations", []).extend([
            "The pipeline warned that seq2seq chunk_length_s is experimental.",
            "The initial ASCII tokenizer split accented names into multiple words.",
            "The pipeline warned max_new_tokens took precedence over model max_length.",
        ])
        report["previousInspections"] = [*history, previous]
    failures = 0
    for take, audio, rate in inputs:
        item = {key: take[key] for key in ["id", "unit", "speaker", "text", "file", "sha256"]}
        item["signal"] = signal_report(audio, rate)
        start = time.monotonic()
        try:
            divisor = math.gcd(rate, 16000)
            resampled = resample_poly(audio, 16000 // divisor, rate // divisor).astype(np.float32)
            with torch.inference_mode():
                result = recognizer({"array": resampled, "sampling_rate": 16000},
                                    return_timestamps="word", generate_kwargs=generate)
            item["asr"] = result
            item["comparison"] = compare(take["text"], result["text"], result.get("chunks", []))
        except Exception as error:
            failures += 1
            item["error"] = f"{type(error).__name__}: {error}"
        item["elapsedSeconds"] = time.monotonic() - start
        report["takes"].append(item)
        print(json.dumps({"id": item["id"], "asr": item.get("asr"),
                          "comparison": item.get("comparison"), "error": item.get("error")}), flush=True)
        write_reports(root, report)
    if digest((directory / "takes.json").read_bytes()) != report["indexSha256"]:
        raise RuntimeError("Candidate index changed during inspection; report is incomplete")
    report["complete"] = failures == 0
    report["failedTakeCount"] = failures
    write_reports(root, report)
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
