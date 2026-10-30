"""Verify one explicit frozen inspection run, then derive new contact sheets.

Run with --run <absolute run directory>. Old, failed, stale or complete-capture
runs are refused. Source PNGs and earlier receipts remain untouched; generated
sheets are sampling aids and never certify whole playback or listening.
"""
import argparse
import hashlib
import json
import os
import re
from pathlib import Path, PurePosixPath
from uuid import uuid4

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
REPOSITORY = ROOT.parents[1]
RUNS = ROOT / "public/outputs/episode-one/runs"
SAMPLES = ("entry", "middle", "exit")


def owned(base: Path, relative: str) -> Path:
    """Resolve a normalized owned path and refuse linked or escaping inputs."""
    if (not isinstance(relative, str) or not relative or "\\" in relative
            or PurePosixPath(relative).is_absolute()
            or any(part in ("", ".", "..") for part in relative.split("/"))):
        raise ValueError(f"Invalid manifest path: {relative!r}")
    target = base.joinpath(*relative.split("/"))
    if not target.is_relative_to(base):
        raise ValueError(f"Path escapes owner: {relative}")
    cursor = target
    while cursor != base:
        if cursor.is_symlink():
            raise ValueError(f"Linked manifest path: {relative}")
        cursor = cursor.parent
    return target


def identity(base: Path, file: Path) -> dict:
    """Identify regular saved bytes; this establishes integrity, not quality."""
    relative = file.relative_to(base).as_posix()
    checked = owned(base, relative)
    if not checked.is_file():
        raise ValueError(f"Not a regular file: {checked}")
    data = checked.read_bytes()
    return {"path": relative, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}


def load_json(file: Path) -> dict:
    """Parse a retained UTF-8 record without executing its contents."""
    return json.loads(file.read_text(encoding="utf-8"))


def fingerprint() -> list[dict]:
    """Rediscover the same actual input population as the capture host."""
    fixed = [
        "index.html", "package.json", "tsconfig.json", "vite.config.ts", "vite.capture.config.ts",
        "scripts/capture.ts", "scripts/inspect-frames.py", "scripts/prepare-film.py",
        "scripts/episode_foley.py", "scripts/generate-speech.py", "public/film.json",
        "docs/body/screenplay/001-chronicle/001-road.md", "public/audio/001-road/takes.json",
        "public/audio/001-road/selection.json", ".capture/capture.mjs",
    ]
    files = {owned(ROOT, relative) for relative in fixed}
    directories = [ROOT / "src"] + [REPOSITORY / "packages" / name / "src"
                                    for name in ("engine", "interface", "viewer", "render")]
    for directory in directories:
        for file in directory.rglob("*"):
            if re.search(r"\.(?:ts|css)$", file.name):
                files.add(owned(directory, file.relative_to(directory).as_posix()))
    python = [ROOT / "scripts/prepare-film.py"]
    visited = set()
    imports = re.compile(r"^\s*(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))", re.MULTILINE)
    while python:
        file = python.pop()
        if file in visited:
            continue
        visited.add(file)
        files.add(file)
        for match in imports.finditer(file.read_text(encoding="utf-8")):
            module = (match.group(1) or match.group(2)).replace(".", "/")
            dependency = owned(file.parent, f"{module}.py")
            if dependency.exists():
                python.append(dependency)
    audio = ROOT / "public/audio/001-road"
    takes = load_json(audio / "takes.json")
    for take in takes["takes"]:
        files.add(owned(audio, take["file"]))
    selection = load_json(audio / "selection.json")
    for selected in selection["changes"]:
        for file, expected in ((owned(audio, selected["file"]), selected["sha256"]),
                               (owned(ROOT, selected["provenance"]), selected["provenanceSha256"])):
            actual = identity(REPOSITORY, file)
            if actual["sha256"] != expected:
                raise ValueError(f"Changed selected media/provenance: {actual['path']}")
            files.add(file)
    film = load_json(ROOT / "public/film.json")
    for cue in film["cues"]:
        if cue.get("file"):
            files.add(owned(audio, cue["file"]))
    address = film["audio"]
    if not isinstance(address, str) or not address.startswith("/") or address.startswith("//"):
        raise ValueError("Film audio must name its local public asset")
    files.add(owned(ROOT / "public", address[1:]))
    files.add(REPOSITORY / "pnpm-lock.yaml")
    # Repository paths here use ASCII; this is the capture host's code-unit order.
    return sorted((identity(REPOSITORY, file) for file in files), key=lambda record: record["path"])


def validate_manifest(entries: object, owner: Path) -> list[dict]:
    """Verify every recorded file and reject duplicate or malformed identities."""
    if not isinstance(entries, list) or not entries:
        raise ValueError("Missing file inventory")
    paths = []
    for entry in entries:
        if (not isinstance(entry, dict) or set(entry) != {"path", "bytes", "sha256"}
                or type(entry["bytes"]) is not int or entry["bytes"] < 0
                or not isinstance(entry["sha256"], str)
                or not re.fullmatch(r"[a-f0-9]{64}", entry["sha256"])):
            raise ValueError("Malformed file inventory entry")
        file = owned(owner, entry["path"])
        if identity(owner, file) != entry:
            raise ValueError(f"Changed file: {entry['path']}")
        paths.append(entry["path"])
    if paths != sorted(set(paths)):
        raise ValueError("File inventory must be sorted and unique")
    return entries


def validate_run(run: Path) -> tuple[dict, dict, dict]:
    """Require current source, frozen film and exact successful output identities."""
    if run.parent != RUNS or not run.is_dir() or run.is_symlink():
        raise ValueError("--run must name one actual directory directly below the production runs folder")
    if (run / "failed.json").exists():
        raise ValueError("Failed inspection runs cannot be renewed")
    baseline_file = owned(run, "baseline.json")
    completed_file = owned(run, "completed.json")
    if not baseline_file.is_file() or not completed_file.is_file():
        raise ValueError("Both baseline.json and completed.json are required")
    baseline = load_json(baseline_file)
    completed = load_json(completed_file)
    for record in (baseline, completed):
        if record.get("schemaVersion") != 2 or record.get("mode") != "inspection":
            raise ValueError("Only version 2 inspection runs are accepted")
        if record.get("run") != run.name:
            raise ValueError("Run directory and record identity differ")
    if (completed.get("completed") is not True or completed.get("errors") != []
            or baseline.get("runtimeIdentity") != completed.get("runtimeIdentity")):
        raise ValueError("Incomplete or inconsistent inspection identity")
    baseline_sha = hashlib.sha256(baseline_file.read_bytes()).hexdigest()
    if completed.get("baselineSha256") != baseline_sha:
        raise ValueError("Baseline receipt bytes changed")
    inputs = validate_manifest(baseline.get("inputs"), REPOSITORY)
    serialized = json.dumps(inputs, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    if hashlib.sha256(serialized).hexdigest() != baseline["runtimeIdentity"]:
        raise ValueError("Input fingerprint and runtime identity differ")
    if fingerprint() != inputs:
        raise ValueError("Current source/media population differs from this run")
    film_path = (ROOT / "public/film.json").relative_to(REPOSITORY).as_posix()
    film_identity = next((item for item in inputs if item["path"] == film_path), None)
    if not film_identity or baseline.get("film") != film_identity or completed.get("filmSha256") != film_identity["sha256"]:
        raise ValueError("Film does not belong to the frozen input population")
    film = load_json(ROOT / "public/film.json")
    profile = {key: film[key] for key in ("width", "height", "fps", "frames", "duration")}
    if baseline.get("profile") != profile:
        raise ValueError("Frozen film profile differs from the captured baseline")
    source = (ROOT / "docs/body/screenplay/001-chronicle/001-road.md").relative_to(REPOSITORY).as_posix()
    if film["sourceSha256"] != next(item["sha256"] for item in inputs if item["path"] == source):
        raise ValueError("Film screenplay identity differs from its actual input")
    inventory = validate_manifest(completed.get("outputs"), run)
    recorded = {entry["path"] for entry in inventory}
    actual = set()
    for file in run.iterdir():
        if file.name in ("baseline.json", "completed.json"):
            continue
        if file.name == "contact-sheets" and file.is_dir() and not file.is_symlink():
            continue
        if not file.is_file() or file.is_symlink():
            raise ValueError(f"Unexpected run output: {file.name}")
        actual.add(file.name)
    if actual != recorded:
        raise ValueError("Emitted output population differs from the completion inventory")
    expected_png = {f"probe-{shot['id']}-{sample}.png" for shot in film["shots"] for sample in SAMPLES}
    expected_png.add("viewer-controls.png")
    if {name for name in recorded if name.endswith(".png")} != expected_png:
        raise ValueError("The complete entry/middle/exit PNG population is required")
    if any(name.endswith(".mp4") for name in recorded):
        raise ValueError("Inspection mode must not claim a complete encoded output")
    if "probe-observations.json" not in recorded:
        raise ValueError("Missing inventoried probe observations")
    observations = load_json(run / "probe-observations.json")
    if observations.get("errors") != [] or len(observations.get("observations", [])) != len(film["shots"]) * 3:
        raise ValueError("Missing or failed complete sample observations")
    if {entry.get("shot") for entry in observations.get("replay", [])} != {shot["id"] for shot in film["shots"]}:
        raise ValueError("Missing reverse-seek observations")
    if any(entry.get("identical") is not True for entry in observations["replay"]):
        raise ValueError("Rendered reverse seeking was not identical")
    if not any(item.get("sha256") == film_identity["sha256"] and item.get("url", "").split("?")[0].endswith("/film.json")
               for item in completed.get("served", [])):
        raise ValueError("The browser's frozen film response was not observed")
    return baseline, completed, film


def main() -> None:
    """Create new derivative sheets only after the entire inspection passes integrity checks."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", required=True, help="Explicit absolute or working-directory-relative inspection run directory")
    args = parser.parse_args()
    run = Path(os.path.abspath(args.run))
    # Do not resolve away a user-supplied link before checking the actual directory.
    baseline, completed, film = validate_run(run)
    destination = run / "contact-sheets" / uuid4().hex
    destination.mkdir(parents=True, exist_ok=False)
    generated = []
    for sample in SAMPLES:
        for offset in range(0, len(film["shots"]), 12):
            sheet = Image.new("RGB", (1280, 4 * 205), "#111722")
            draw = ImageDraw.Draw(sheet)
            for index, shot in enumerate(film["shots"][offset:offset + 12]):
                x, y = index % 3 * 426, index // 3 * 205
                with Image.open(run / f"probe-{shot['id']}-{sample}.png") as original:
                    if original.size != (film["width"], film["height"]):
                        raise ValueError(f"Unexpected capture dimensions: {shot['id']}/{sample}")
                    image = original.convert("RGB")
                    image.thumbnail((420, 176))
                    sheet.paste(image, (x, y + 24))
                local = 0 if sample == "entry" else min(4, shot["duration"] / 2) if sample == "middle" else shot["duration"] - 1 / film["fps"]
                draw.text((x + 8, y + 5), f"{shot['start'] + local:.2f}s | {shot['unit']} / {shot['id']} | {sample}", fill="#eee0c6")
            target = destination / f"{sample}-sheet-{offset // 12 + 1}.jpg"
            sheet.save(target, quality=93)
            generated.append(identity(run, target))
    # Detect a concurrent edit or replaced original after reading the contact-sheet population.
    if fingerprint() != baseline["inputs"]:
        raise ValueError("Source changed while sheets were produced")
    validate_manifest(completed["outputs"], run)
    receipt = {"schemaVersion": 2, "kind": "derived-contact-sheets", "run": baseline["run"],
               "runtimeIdentity": baseline["runtimeIdentity"], "filmSha256": completed["filmSha256"],
               "baselineSha256": completed["baselineSha256"],
               "completedSha256": hashlib.sha256((run / "completed.json").read_bytes()).hexdigest(),
               "sourceSamples": len(film["shots"]) * 3, "sheets": generated,
               "scope": "Current input and output byte integrity plus complete entry/middle/exit contact-sheet population; no visual, whole-playback or listening acceptance"}
    with (destination / "inspection-receipt.json").open("x", encoding="utf-8") as stream:
        json.dump(receipt, stream, ensure_ascii=False, indent=2)
        stream.write("\n")
    print(json.dumps({"run": baseline["run"], "runtimeIdentity": baseline["runtimeIdentity"],
                      "directory": str(destination), "sheets": len(generated), "samples": receipt["sourceSamples"]}))


if __name__ == "__main__":
    main()
