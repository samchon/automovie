"""Generate exactly two unselected line-026 candidates with predeclared seeds.

Only this directory is writable. The canonical manuscript, 27 original takes,
candidate index and selected mix remain inputs. All generation settings and the
existing generated Soult voice reference are retained; only seeds change. ASR is
diagnostic and receives no expected text or prior transcript as a prompt.
"""

import copy
import gc
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
from voxcpm import VoxCPM


def digest(data: bytes) -> str:
    """Identify actual retained bytes rather than inferring identity from a seed."""
    return hashlib.sha256(data).hexdigest()


def save(folder: Path, record: dict) -> None:
    """Keep both results and partial failures without adopting or ranking takes."""
    (folder / "candidates.json").write_text(
        json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    rows = []
    for item in record["candidates"]:
        duration = item.get("signal", {}).get("duration", "failed")
        tiny = item.get("recognition", {}).get("openai/whisper-tiny.en", {})
        base = item.get("recognition", {}).get("openai/whisper-base.en", {})
        rows.append(f"| {item['seed']} | {duration} | "
                    f"{tiny.get('result', {}).get('text', tiny.get('error', 'pending')).strip()} | "
                    f"{base.get('result', {}).get('text', base.get('error', 'pending')).strip()} |")
    text = "\n".join([
        "# Unselected alternatives for line 026", "",
        "Exactly two seeds were declared before generation: `9426` and `19426`. "
        "The canonical text, Soult style, generated reference waveform, VoxCPM "
        "snapshot and generation settings match the original take. Each seed is "
        "attempted once with `retry_badcase=False`; neither result is replaced "
        "or selected by recognition. All takes remain `candidate-unheard`.", "",
        f"Run: `{record['createdUtc']}`. Complete: `{record['complete']}`.", "",
        "| Seed | Seconds | Tiny raw recognition | Base raw recognition |",
        "| --- | ---: | --- | --- |", *rows, "",
        "The [raw record](candidates.json) retains exact inputs and their hashes, "
        "both new waveforms, measurements, model revisions, actual word times, "
        "decoder parameters and failed attempts. ASR receives no expected text, "
        "captions or original transcript. Neither agreement with the intended "
        "words nor a larger model establishes listening or acting acceptance.", "",
        "Original assets and the selected mix are not written by this script. "
        "The protected-input digest comparison records whether they changed "
        "during this isolated run. No candidate is wired into film playback.", "",
        "This script refuses a second run in the same directory after a record "
        "exists, preserving the declared two-attempt population. Run only with "
        "the adopted isolated Python runtime and existing `HF_HOME`.", ""])
    (folder / "README.md").write_text(text, encoding="utf-8")


def main() -> None:
    """Generate two immutable candidates, then inspect each with two local ASRs.

    TTS uses the original 12 CPU threads and ASR uses four. Model downloads are
    unnecessary: all three exact revisions are already cached. A failed attempt
    remains in the record and is never rerolled. Only these alternatives change.
    """
    folder = Path(__file__).resolve().parent
    root = Path(__file__).resolve().parents[4]
    if (folder / "candidates.json").exists() or list(folder.glob("*.wav")):
        raise RuntimeError("The declared alternatives already exist; do not reroll")
    original = root / "public/audio/001-road"
    index_path = original / "takes.json"
    index_bytes = index_path.read_bytes()
    index = json.loads(index_bytes)
    take = next(item for item in index["takes"] if item["id"] == "line-026")
    reference = next(item for item in index["takes"]
                     if item["sha256"] == take["inputs"]["reference"])
    source_path = root / index["source"]
    source_bytes = source_path.read_bytes()
    if (digest(source_bytes) != index["sourceSha256"] or len(index["takes"]) != 27
            or take["speaker"] != "SOULT" or take["text"] != "Yes, Sire."):
        raise ValueError("Canonical source or candidate population differs")
    source_line = source_bytes.decode("utf-8").splitlines()[take["sourceLine"] - 1]
    if source_line != f"{take['speaker']}: {take['text']}":
        raise ValueError("Canonical source line differs")
    protected = {index_path: digest(index_bytes), source_path: digest(source_bytes)}
    for item in index["takes"]:
        filename = original / item["file"]
        if Path(item["file"]).name != item["file"] or digest(filename.read_bytes()) != item["sha256"]:
            raise ValueError(f"Original candidate bytes differ: {item['id']}")
        protected[filename] = item["sha256"]
    mix = original / "episode-mix.wav"
    if mix.exists():
        protected[mix] = digest(mix.read_bytes())
    model_config = take["inputs"]["model"]
    if (model_config["voxcpm"] != importlib.metadata.version("voxcpm")
            or model_config["torch"] != torch.__version__):
        raise ValueError("Generation runtime no longer matches the original")
    record = {"createdUtc": datetime.now(timezone.utc).isoformat(), "complete": False,
              "acceptance": "candidate-unheard", "selected": False,
              "declaredSeeds": [9426, 19426], "changedInput": "seed",
              "originalTake": take, "source": index["source"],
              "sourceSha256": index["sourceSha256"], "referenceTake": reference,
              "generation": {"threads": 12, "loadDenoiser": False, "optimize": False,
                             "device": "cpu", "localFilesOnly": True,
                             "retryBadcase": False},
              "asrParameters": {"threads": 4, "device": "cpu", "dtype": "float32",
                                "sampleRate": 16000, "resampling": "scipy.signal.resample_poly(1,3)",
                                "returnTimestamps": "word", "chunkLengthSeconds": None,
                                "expectedTextPrompt": False, "priorTranscriptPrompt": False,
                                "generate": {"do_sample": False, "num_beams": 1,
                                             "condition_on_prev_tokens": False}},
              "versions": {name: importlib.metadata.version(name)
                           for name in ["voxcpm", "torch", "transformers", "scipy", "soundfile"]},
              "protectedInputs": {path.relative_to(root).as_posix(): value
                                  for path, value in protected.items()}, "candidates": []}
    save(folder, record)
    torch.set_num_threads(12)
    torch.set_num_interop_threads(1)
    try:
        snapshot = snapshot_download(model_config["model"], revision=model_config["snapshot"],
                                     local_files_only=True)
        model = VoxCPM.from_pretrained(snapshot, load_denoiser=False, optimize=False,
                                      device="cpu", local_files_only=True)
        for seed in record["declaredSeeds"]:
            inputs = copy.deepcopy(take["inputs"])
            inputs["seed"] = seed
            assert {key: value for key, value in inputs.items() if key != "seed"} == {
                key: value for key, value in take["inputs"].items() if key != "seed"}
            input_key = digest(json.dumps(inputs, sort_keys=True).encode())
            item = {"seed": seed, "inputs": inputs, "inputKey": input_key,
                    "file": f"line-026-seed-{seed}-{input_key[:16]}.wav",
                    "acceptance": "candidate-unheard", "selected": False}
            record["candidates"].append(item)
            save(folder, record)
            start = time.monotonic()
            try:
                torch.manual_seed(seed)
                audio = model.generate(text=f"({inputs['voice']}){inputs['text']}",
                                       cfg_value=model_config["cfgValue"],
                                       inference_timesteps=model_config["inferenceTimesteps"],
                                       retry_badcase=False,
                                       reference_wav_path=str(original / reference["file"]))
                if audio.ndim != 1 or len(audio) == 0 or not np.isfinite(audio).all():
                    raise ValueError("Invalid generated mono candidate")
                destination = folder / item["file"]
                with destination.open("xb") as stream:
                    sf.write(stream, audio, model.tts_model.sample_rate, format="WAV", subtype="PCM_16")
                saved, rate = sf.read(destination, dtype="float64")
                item["sha256"] = digest(destination.read_bytes())
                item["signal"] = {"frames": len(saved), "sampleRate": rate,
                                  "duration": len(saved) / rate,
                                  "peak": float(np.max(np.abs(saved))),
                                  "rms": float(np.sqrt(np.mean(saved * saved))),
                                  "clippedSamples": int(np.sum(np.abs(saved) >= 32767 / 32768))}
            except Exception as error:
                item["generationError"] = f"{type(error).__name__}: {error}"
            item["generationElapsedSeconds"] = time.monotonic() - start
            save(folder, record)
            print(json.dumps(item, ensure_ascii=False), flush=True)
        del model
        gc.collect()
    except Exception as error:
        record["generationSetupError"] = f"{type(error).__name__}: {error}"
        save(folder, record)
    torch.set_num_threads(4)
    for repository, revision in [
            ("openai/whisper-tiny.en", "87c7102498dcde7456f24cfd30239ca606ed9063"),
            ("openai/whisper-base.en", "911407f4214e0e1d82085af863093ec0b66f9cd6")]:
        try:
            snapshot = snapshot_download(repository, revision=revision, local_files_only=True,
                                         allow_patterns=["*.json", "*.txt", "*.safetensors"])
            recognizer = pipeline("automatic-speech-recognition", model=snapshot,
                                  device="cpu", dtype=torch.float32)
            for item in record["candidates"]:
                if "sha256" not in item:
                    continue
                observation = {"model": repository, "snapshot": Path(snapshot).name}
                item.setdefault("recognition", {})[repository] = observation
                start = time.monotonic()
                try:
                    filename = folder / item["file"]
                    if digest(filename.read_bytes()) != item["sha256"]:
                        raise ValueError("Alternative bytes changed before ASR")
                    audio, rate = sf.read(filename, dtype="float64")
                    if rate != 48000:
                        raise ValueError("Unexpected alternative sample rate")
                    resampled = resample_poly(audio, 1, 3).astype(np.float32)
                    with torch.inference_mode():
                        observation["result"] = recognizer(
                            {"array": resampled, "sampling_rate": 16000}, return_timestamps="word",
                            generate_kwargs=record["asrParameters"]["generate"])
                except Exception as error:
                    observation["error"] = f"{type(error).__name__}: {error}"
                observation["elapsedSeconds"] = time.monotonic() - start
                save(folder, record)
                print(json.dumps({"seed": item["seed"], **observation}, ensure_ascii=False), flush=True)
            del recognizer
            gc.collect()
        except Exception as error:
            record.setdefault("asrSetupErrors", {})[repository] = f"{type(error).__name__}: {error}"
            save(folder, record)
    record["changedProtectedInputs"] = [path.relative_to(root).as_posix()
                                         for path, value in protected.items()
                                         if digest(path.read_bytes()) != value]
    record["complete"] = not record["changedProtectedInputs"] and len(record["candidates"]) == 2 and all(
        "sha256" in item and all("result" in item.get("recognition", {}).get(repository, {})
                                 for repository in ["openai/whisper-tiny.en", "openai/whisper-base.en"])
        for item in record["candidates"])
    save(folder, record)
    if not record["complete"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
