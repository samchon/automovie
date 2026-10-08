"""Publish a current maintained source manifest with qualified guide components.

Code and recipes remain in their original directory. The new immutable
manifest addresses their actual bytes and the completed generated head/ear
guides relative to its own directory. Frozen nasal socket selections keep
their authored authority and missing original recipe; publication does not
turn them into acquired anatomy or excuse their source maintenance debt.
Run with --source DIRECTORY --head-guides COMPONENT --ear-guides COMPONENT --socket-guides COMPONENT
--out NEW_DIRECTORY, then pass that directory as the authoring --source.
An explicit --raw-profiles directory supplies original profile bytes when
maintained code and recipes live elsewhere. Every original profile must still
match the existing source manifest's byte authority; formatted or changed
profile data cannot acquire the original authority through this option.
"""

import argparse
import hashlib
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from SourceInputObservation import SourceInputObservation
from SourcePublication import SourcePublication
from read_source_publication import read_source_publication


def _main():
    parser = argparse.ArgumentParser()
    for name in ("source", "head-guides", "ear-guides", "socket-guides", "out"):
        parser.add_argument("--" + name, type=Path, required=True)
    parser.add_argument("--raw-profiles", type=Path)
    args = parser.parse_args()
    if args.out.exists() and any(args.out.iterdir()):
        raise ValueError("Source manifest export requires a new immutable component output directory.")
    with SourcePublication(args.out) as publication:
        _export(args, publication)


def _export(args, publication):
    root = Path(__file__).resolve().parent
    original = args.source / "source-inputs.json"
    observed = SourceInputObservation([original, Path(__file__),
        root.parent / "SourceInputObservation.py", root.parent / "SourcePublication.py",
        root.parent / "read_source_publication.py"])
    authored = json.loads(original.read_text(encoding="utf-8"))
    components = []
    for directory, required in ((args.head_guides, ["head-source-guide.json", "head-source-guide-nasal.json"]),
                                (args.ear_guides, ["ear-source-guide.json"]),
                                (args.socket_guides, ["nasal-socket-ports.json"])):
        observed.extend([directory / "source-publication.json"])
        captured = read_source_publication(directory, required)
        components.append(captured)
        observed.extend([directory / name for name in captured])
        for name, payload in captured.items():
            observed.expect(directory / name, len(payload), hashlib.sha256(payload).hexdigest())
    head = json.loads(components[0]["head-source-guide.json"])
    nasal = json.loads(components[0]["head-source-guide-nasal.json"])
    ear = json.loads(components[1]["ear-source-guide.json"])
    socket = json.loads(components[2]["nasal-socket-ports.json"])
    if head["basis"] != nasal["basis"] or head["basis"] != ear["generation"] or \
            head["originalNativeCount"] != nasal["originalNativeCount"] or \
            head["originalNativeCount"] != ear["originalNativeCount"] or head["basis"] != socket["nativeGeneration"]:
        raise ValueError("Generated source profiles have different historical native authorities.")

    def entry(file):
        resolved = file.resolve()
        observed.extend([resolved])
        payload = resolved.read_bytes()
        observed.expect(resolved, len(payload), hashlib.sha256(payload).hexdigest())
        return {"path": Path(os.path.relpath(resolved, args.out.resolve())).as_posix(),
                "bytes": len(payload), "sha256": hashlib.sha256(payload).hexdigest()}

    replacements = {"sourceGuide": args.head_guides / "head-source-guide.json",
                    "nasalExteriorGuide": args.head_guides / "head-source-guide-nasal.json",
                    "earGuide": args.ear_guides / "ear-source-guide.json",
                    "nasalSocket": args.socket_guides / "nasal-socket-ports.json"}
    profile_root = args.raw_profiles if args.raw_profiles is not None else args.source
    originals = {}
    for name, original_profile in authored["profiles"].items():
        preserved = entry(profile_root / original_profile["path"])
        if preserved["sha256"] != original_profile["sha256"]:
            raise ValueError("Original raw profile differs from its existing receipt: " + name)
        originals[name] = preserved
    superseded = {}
    for name in replacements:
        original_profile = authored["profiles"][name]
        file = profile_root / original_profile["path"]
        preserved = originals[name]
        profile_payload = file.read_bytes()
        observed.expect(file, len(profile_payload), hashlib.sha256(profile_payload).hexdigest())
        value = json.loads(profile_payload)
        native_generation = value.get("generation", value.get("nativeGeneration"))
        if value.get("schema") == "automovie-head-source-guide/1":
            native_generation = value["basis"]
        superseded[name] = {**preserved, "nativeGeneration": native_generation,
                            "sourceBasis": value.get("basis"),
                            "currentConsumption": "Replaced as an active profile; explicit legacy source-input manifests may still address the original artifact.",
                            "directExportConsumers": ["export_nasal_socket_guide.py: pinned preserved-cut correspondence"] if name == "nasalSocket" else [],
                            "qualification": "Original raw derived guide retained unchanged. An absent native generation remains unknown; source basis and authored cuts do not establish clinical anatomy."}
    profiles = {name: item for name, item in originals.items() if name not in replacements}
    profiles.update({name: entry(file) for name, file in replacements.items()})
    recipes = {name: entry(args.source / item["path"]) for name, item in authored["recipe"].items()}
    maintained = {file.resolve() for file in args.source.glob("*.py")}
    original_profiles = {(args.source / item["path"]).resolve() for item in authored["profiles"].values()}
    maintained.update((args.source / item["path"]).resolve() for item in authored["files"]
                      if (args.source / item["path"]).resolve() not in original_profiles)
    maintained.update(root.parent / name for name in ("SourceInputObservation.py", "SourcePublication.py", "read_source_publication.py",
                                                    "compile-head-trait-endpoints.py", "replay-head-source-provider.py"))
    maintained.update(root / name for name in ("SourceAuthoringInputObservation.py", "read_source_profile.py", "export_ear_source_guide.py", "read_ear_port.py"))
    maintained.update(root / name for name in ("source-guide-recipe.json", "nasal-socket-selection-recipe.json", "export_nasal_socket_guide.py"))
    files = {item["path"]: item for item in [*[entry(file) for file in sorted(maintained)],
                                              *profiles.values(), *recipes.values()]}
    result = {**authored, "publication": "source-publication.json", "recipe": recipes, "profiles": profiles,
              "supersededProfiles": superseded,
              "files": [files[name] for name in sorted(files)],
              "qualification": "Source-owned coarse formula and input receipts. Head and ear guides derive pinned historical native correspondence through maintained exporters. Nasal socket selections remain frozen authored cuts; the original selection recipe and clinical aperture authority are not established. This manifest binds source inputs only; completed generation, geometry and physical acceptance are separate."}
    receipt = args.out / "source-inputs.json"
    receipt.write_text(json.dumps(result, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    publication.complete(hashlib.sha256(receipt.read_bytes()).hexdigest(), observed.verify)
    print("[head-authoring-inputs]", len(files), "maintained input records", flush=True)


if __name__ == "__main__":
    _main()
