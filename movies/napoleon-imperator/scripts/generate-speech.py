"""Generate fixed candidate dialogue from episode 1 with the adopted local VoxCPM.

This integration does not grant listening acceptance. It preserves every generated
take under an input-derived filename and records saved-file measurements. The
longest actual line supplies a generated voice reference for its speaker's other
lines; no external person's recording is used. Model loading and generation happen
only here, never inside film playback.
"""

import argparse
import hashlib
import importlib.metadata
import json
import re
import time
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
from voxcpm import VoxCPM
from huggingface_hub import snapshot_download


VOICES = {
    "SOLDIER": "A young adult man, clear English, urgent and breathless, natural speech",
    "BERTHIER": "A middle-aged man, clear English, measured and practical, dry medium-low voice",
    "MURAT": "An adult man, clear English, confident resonant voice, energetic and concerned",
    "SOULT": "A middle-aged man, clear English, low measured voice, controlled and reserved",
    "LANNES": "An adult man, clear English, rough direct voice, forceful and indignant",
    "NAPOLEON": "An adult man, clear English, restrained decisive medium voice, economical authority",
    "WEYROTHER": "An older adult man, clear English, precise projected command voice",
    "STAFF OFFICER": "An adult man, clear English, relaxed tired voice, quiet conversation",
    "SOLDIERS": "An adult man, clear English, enthusiastic loud cheer",
    "DAVOUT": "An adult man, clear English, low clipped practical voice, firm under pressure",
    "AUTHOR": "An adult male narrator, clear English, close warm dry voice, reflective and unhurried",
}


def digest(data: bytes) -> str:
    """Identify exact bytes, including the saved audio rather than its seed."""
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    """Preflight the complete dialogue population, then retain each actual result.

    Source text and six H2 identities come from the current canonical screenplay.
    Missing speakers, stale candidate bytes and invalid output signals fail with
    the completed prefix retained. A rerun reuses only an exact input-key and
    saved-byte match; it cannot silently replace a previously generated take.
    """
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path)
    parser.add_argument("--model", choices=["openbmb/VoxCPM2"], default="openbmb/VoxCPM2")
    parser.add_argument("--threads", type=int, default=12)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    source = root / "docs/body/screenplay/001-chronicle/001-road.md"
    source_bytes = source.read_bytes()
    lines = []
    unit = None
    for number, text in enumerate(source_bytes.decode("utf-8").splitlines(), 1):
        heading = re.match(r"## .*\{#([^}]+)\}", text)
        if heading:
            unit = heading.group(1)
        match = re.match(r"^([A-Z][A-Z ]+)(?: \(([^)]+)\))?: (.+)$", text)
        if match:
            speaker, qualifier, words = match.groups()
            if unit is None or speaker not in VOICES:
                raise ValueError(f"Unowned dialogue at source line {number}")
            lines.append({"id": f"line-{len(lines)+1:03d}", "unit": unit,
                          "speaker": speaker, "qualifier": qualifier,
                          "text": words, "sourceLine": number})
    if len(lines) != 27 or {line["unit"] for line in lines} != {
        "road", "letter", "plans", "night", "battle", "victory"
    }:
        raise ValueError("Episode dialogue population changed; inspect its handoff first.")
    if args.threads < 1:
        raise ValueError("threads must be positive")
    output = args.output.resolve() if args.output else root / "public/audio/001-road"
    output.mkdir(parents=True, exist_ok=True)
    previous = output / "takes.json"
    prior = json.loads(previous.read_text(encoding="utf-8")) if previous.exists() else {}
    cached = {item["id"]: item for item in prior.get("takes", [])}
    references = {}
    for speaker in VOICES:
        selected = [line for line in lines if line["speaker"] == speaker]
        references[speaker] = max(selected, key=lambda line: len(line["text"]))["id"]
    ordered = sorted(lines, key=lambda line: (line["id"] != references[line["speaker"]], line["id"]))
    torch.set_num_threads(args.threads)
    start = time.monotonic()
    snapshot_path = Path(snapshot_download(args.model,
        revision="32279effe8c19989596f05d353d1447f51d9e915", local_files_only=True))
    snapshot_identity = snapshot_path.name
    if snapshot_identity != "32279effe8c19989596f05d353d1447f51d9e915":
        raise ValueError("The adopted local model snapshot did not resolve exactly")
    model = VoxCPM.from_pretrained(str(snapshot_path), load_denoiser=False,
                                  optimize=False, device="cpu", local_files_only=True)
    takes = {}
    model_config = {
        "model": args.model, "voxcpm": importlib.metadata.version("voxcpm"),
        "torch": torch.__version__, "cfgValue": 2.0, "inferenceTimesteps": 10,
        "device": "cpu", "snapshot": snapshot_identity,
    }
    for line in ordered:
        if source.read_bytes() != source_bytes:
            raise RuntimeError("Canonical source changed during generation")
        reference = takes.get(references[line["speaker"]])
        seed = 4100 + int(line["id"].split("-")[1])
        inputs = {"text": line["text"], "voice": VOICES[line["speaker"]],
                  "seed": seed, "model": model_config,
                  "reference": reference["sha256"] if reference else None}
        key = digest(json.dumps(inputs, sort_keys=True).encode())
        filename = f"{line['id']}-{key[:16]}.wav"
        target = output / filename
        existing = cached.get(line["id"])
        if existing and existing["inputKey"] == key and target.exists():
            if digest(target.read_bytes()) != existing["sha256"]:
                raise RuntimeError(f"Candidate bytes changed: {filename}")
            takes[line["id"]] = existing
        else:
            if target.exists():
                raise RuntimeError(f"Unrecorded candidate already exists: {filename}")
            torch.manual_seed(seed)
            kwargs = {"text": f"({VOICES[line['speaker']]}){line['text']}",
                      "cfg_value": 2.0, "inference_timesteps": 10,
                      "retry_badcase": False}
            if reference:
                kwargs["reference_wav_path"] = str(output / reference["file"])
            audio = model.generate(**kwargs)
            if audio.ndim != 1 or len(audio) == 0 or not np.isfinite(audio).all():
                raise ValueError(f"Invalid mono candidate: {line['id']}")
            sf.write(target, audio, model.tts_model.sample_rate, subtype="PCM_16")
            saved, rate = sf.read(target)
            takes[line["id"]] = {**line, "file": filename, "inputKey": key,
                "sha256": digest(target.read_bytes()), "frames": len(saved),
                "sampleRate": rate, "duration": len(saved)/rate,
                "peak": float(np.max(np.abs(saved))),
                "rms": float(np.sqrt(np.mean(saved*saved))),
                "inputs": inputs, "acceptance": "candidate-unheard"}
        record = {"source": source.relative_to(root).as_posix(),
                  "sourceSha256": digest(source_bytes), "model": model_config,
                  "elapsedSeconds": time.monotonic()-start,
                  "complete": len(takes) == len(lines),
                  "takes": [takes[name] for name in sorted(takes)]}
        previous.write_text(json.dumps(record, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
        print(json.dumps({"completed": len(takes), "total": len(lines),
                          "id": line["id"], "duration": takes[line["id"]]["duration"]}), flush=True)


if __name__ == "__main__":
    main()
