"""Acquire and verify the pinned upstream, then build the isolated Blender profile.

Run with Blender's bundled Python (no add-on is enabled here):

    blender --background --factory-startup --python-exit-code 1 \
      --python test/scripts/human-source/prepare-mpfb-profile.py -- \
      --lock test/scripts/human-source/upstream-lock.json \
      --archives <archive cache> --work <new work directory> [--observe]

For every source of the lock the archive is read from the cache directory, or
downloaded from its pinned locator when absent. The archive container digest is
recorded, but a GitHub archive is generated on request and its container bytes
are not a stable identity, so the verified identity is the content digest:
SHA-256 over the sorted `path<TAB>sha256<LF>` lines of every file entry with the
archive's top directory removed. Each license file's own digest is checked as
well. A consumed source whose content or license digest differs from the lock
stops the run: the rights record would no longer describe the bytes.

`--observe` writes the observed digests without comparing them, which is how
the lock itself was first written from the 2026-10-04 acquisition.

Consumed sources are extracted under `<work>/upstream/<name>` and MPFB's
`src/mpfb` is copied (never linked) to
`<work>/blender-profile/extensions/user_default/mpfb`, so running the sampler
with `BLENDER_USER_RESOURCES=<work>/blender-profile` changes no global Blender
setting. Nothing is written inside the repository.
"""
import hashlib
import json
import os
import shutil
import sys
import urllib.request
import zipfile


def log(*parts):
    print("[human-source]", *parts, flush=True)


def argument(arguments, name):
    if name not in arguments:
        raise SystemExit("Missing argument " + name)
    return os.path.abspath(arguments[arguments.index(name) + 1])


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def file_sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as file:
        for block in iter(lambda: file.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


def strip_root(name):
    parts = name.split("/", 1)
    return parts[1] if len(parts) == 2 else ""


def content(archive):
    """Sorted (relative path, bytes digest) of every file entry, root directory removed."""
    rows = []
    for info in archive.infolist():
        if info.is_dir():
            continue
        relative = strip_root(info.filename)
        if not relative:
            continue
        rows.append((relative, sha256(archive.read(info))))
    rows.sort()
    return rows


def safe_extract(archive, destination, keep):
    for info in archive.infolist():
        if info.is_dir():
            continue
        relative = strip_root(info.filename) if keep is None else info.filename
        if not relative or (keep is not None and relative not in keep):
            continue
        target = os.path.abspath(os.path.join(destination, relative))
        if not target.startswith(os.path.abspath(destination) + os.sep):
            raise SystemExit("Archive entry escapes its destination: " + info.filename)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, "wb") as file:
            file.write(archive.read(info))


def main():
    arguments = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    lock_path = argument(arguments, "--lock")
    archives = argument(arguments, "--archives")
    work = argument(arguments, "--work")
    observe = "--observe" in arguments
    with open(lock_path, encoding="utf-8") as file:
        lock = json.load(file)
    if os.path.exists(work):
        raise SystemExit("Work directory already exists: " + work)
    os.makedirs(os.path.join(work, "upstream"))
    os.makedirs(archives, exist_ok=True)
    record = []
    for source in lock["sources"]:
        path = os.path.join(archives, source["archive"])
        downloaded = False
        if not os.path.exists(path):
            if not source["consumed"]:
                record.append({"name": source["name"], "status": "absent-not-consumed"})
                continue
            log("downloading", source["locator"])
            with urllib.request.urlopen(source["locator"]) as response, open(path + ".part", "wb") as file:
                shutil.copyfileobj(response, file)
            os.replace(path + ".part", path)
            downloaded = True
        observed = {"name": source["name"], "downloaded": downloaded, "archiveBytes": os.path.getsize(path), "archiveSha256": file_sha256(path)}
        with zipfile.ZipFile(path) as archive:
            if source.get("entries") is not None:
                rows = sorted((name, sha256(archive.read(name))) for name in source["entries"])
            else:
                rows = content(archive)
            observed["contentFiles"] = len(rows)
            observed["contentSha256"] = sha256("".join(f"{p}\t{d}\n" for p, d in rows).encode("utf-8"))
            digests = dict(rows)
            observed["licenses"] = {name: digests.get(name) for name in source["licenses"]}
            if not observe:
                if observed["contentSha256"] != source["contentSha256"]:
                    raise SystemExit(f"{source['name']}: content digest {observed['contentSha256']} differs from the lock")
                for name, expected in source["licenses"].items():
                    if observed["licenses"][name] != expected:
                        raise SystemExit(f"{source['name']}: license {name} differs from the lock; stop using this asset")
                observed["archiveMatchesLock"] = observed["archiveSha256"] == source.get("archiveSha256")
            if source["consumed"]:
                destination = os.path.join(work, "upstream", source["name"])
                safe_extract(archive, destination, None if source.get("entries") is None else set(source["entries"]))
                observed["extracted"] = os.path.relpath(destination, work).replace(os.sep, "/")
        record.append(observed)
        log("verified" if not observe else "observed", source["name"], observed["contentSha256"])
    mpfb = os.path.join(work, "upstream", "mpfb2", "src", "mpfb")
    if os.path.isdir(mpfb):
        shutil.copytree(mpfb, os.path.join(work, "blender-profile", "extensions", "user_default", "mpfb"))
    with open(os.path.join(work, "acquisition.json"), "w", encoding="utf-8", newline="\n") as file:
        json.dump({"lock": lock_path, "lockSha256": file_sha256(lock_path), "observeOnly": observe, "sources": record}, file, indent=1)
        file.write("\n")
    log("acquisition written", work)


if __name__ == "__main__":
    main()
