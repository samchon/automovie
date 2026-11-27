"use strict";

const { execFileSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript-compiler");

const root = path.resolve(__dirname, "..");

function git(...args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
}

function options(args) {
  const paths = [];
  const check = args[0] === "--check";
  const apply = args[0] === "--apply";
  const checkpoint = apply ? args[1] : undefined;
  for (const item of args.slice(apply ? 2 : check ? 1 : 0)) {
    if (item === "--") continue;
    if (item.startsWith("-")) throw new Error("Pass file or directory paths after the mode.");
    const relative = path.relative(root, path.resolve(root, item));
    if (relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative)) {
      throw new Error("Path is outside the repository: " + item);
    }
    paths.push(relative.replaceAll(path.sep, "/") || ".");
  }
  if (apply && !/^[a-f0-9]{40}$/u.test(checkpoint ?? "")) {
    throw new Error("--apply requires the full SHA of the pushed checkpoint.");
  }
  return { checkpoint, paths: paths.length ? paths : ["packages"] };
}

function pathspecBatches(paths) {
  const unique = new Set(paths);
  if (unique.has(".")) return [[":(literal)."]];

  const batches = [];
  let batch = [];
  let size = 0;
  for (const relative of unique) {
    let parent = path.posix.dirname(relative);
    while (parent !== "." && !unique.has(parent)) parent = path.posix.dirname(parent);
    if (parent !== ".") continue;

    const argument = ":(literal)" + relative;
    // Leave room for the executable, flags and worst-case Windows quoting.
    const cost = 2 * argument.length + 3;
    if (cost > 24000) throw new Error("Git path argument too long: " + relative);
    if (size + cost > 24000) {
      batches.push(batch);
      batch = [];
      size = 0;
    }
    batch.push(argument);
    size += cost;
  }
  if (batch.length) batches.push(batch);
  return batches;
}

function verifyCheckpoint(checkpoint, targetPaths) {
  if (git("rev-parse", "HEAD").trim() !== checkpoint) {
    throw new Error("HEAD is not the requested checkpoint.");
  }
  const dirty = pathspecBatches(targetPaths)
    .map((batch) => git("status", "--porcelain=v1", "--untracked-files=all", "--", ...batch).trim())
    .filter(Boolean)
    .join("\n");
  if (dirty) {
    throw new Error("Selected targets are not clean:\n" + dirty);
  }
  const branch = git("symbolic-ref", "--short", "HEAD").trim();
  const remote = git("config", "--get", "branch." + branch + ".remote").trim();
  const ref = git("config", "--get", "branch." + branch + ".merge").trim();
  if (!remote || remote === "." || !ref.startsWith("refs/heads/")) {
    throw new Error("The branch needs a pushed upstream branch.");
  }
  const remoteHead = git("ls-remote", "--exit-code", "--", remote, ref).trim().split(/\s+/u)[0];
  if (remoteHead !== checkpoint) {
    throw new Error("The upstream branch does not point to the checkpoint.");
  }
}

function applyEdits(text, edits, offset = 0) {
  let result = text;
  let previous = offset + text.length;
  for (const edit of [...edits].sort((left, right) => right.start - left.start)) {
    if (edit.start < offset || edit.end > previous || edit.start > edit.end) {
      throw new Error("Overlapping or invalid source edits.");
    }
    result = result.slice(0, edit.start - offset) + edit.text + result.slice(edit.end - offset);
    previous = edit.start;
  }
  return result;
}

function repoPathKey(relative) {
  const normalized = relative.replaceAll(path.sep, "/");
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

function workspace(trackedFiles) {
  const files = new Map();
  function read(file) {
    if (files.has(file)) return files.get(file);
    if (!fs.existsSync(file)) return undefined;
    const lexical = fs.lstatSync(file);
    if (lexical.isSymbolicLink() || !lexical.isFile()) return undefined;
    const real = fs.realpathSync(file);
    const relative = path.relative(root, real);
    if (relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative)) return undefined;
    if (!fs.statSync(real).isFile()) return undefined;
    const sourceRelative = relative.replaceAll(path.sep, "/");
    if (!trackedFiles.has(repoPathKey(sourceRelative))) return undefined;
    const bytes = fs.readFileSync(real);
    const text = bytes.toString("utf8");
    if (!bytes.equals(Buffer.from(text, "utf8"))) throw new Error("Invalid UTF-8: " + relative);
    const tree = ts.createSourceFile(real, text, ts.ScriptTarget.Latest, true);
    const result = { text, bytes, tree, file: path.resolve(file), real };
    files.set(file, result);
    return result;
  }

  function resolve(file, specifier) {
    if (!specifier?.startsWith(".")) return undefined;
    const base = path.resolve(path.dirname(file), specifier);
    const extension = path.extname(base);
    const replacements = {
      ".js": [".ts", ".tsx", ".js"],
      ".jsx": [".tsx", ".jsx"],
      ".mjs": [".mts", ".mjs"],
      ".cjs": [".cts", ".cjs"],
    };
    const candidates = replacements[extension]
      ? replacements[extension].map((ending) => base.slice(0, -extension.length) + ending)
      : [base, ...[".ts", ".tsx", ".mts", ".cts", "/index.ts", "/index.tsx"].map((ending) => base + ending)];
    return candidates.find((candidate) => read(candidate));
  }

  function snapshots() {
    const unique = new Map();
    for (const item of files.values()) unique.set(item.file, item);
    return [...unique.values()].map((item) => ({
      file: item.file,
      real: item.real,
      relative: path.relative(root, item.file).replaceAll(path.sep, "/"),
      realRelative: path.relative(root, item.real).replaceAll(path.sep, "/"),
      bytes: item.bytes,
    }));
  }

  return { read, resolve, snapshots };
}

function samePath(left, right) {
  const a = path.resolve(left);
  const b = path.resolve(right);
  return process.platform === "win32"
    ? a.toLowerCase() === b.toLowerCase()
    : a === b;
}

function assertBeforeImage(file, expected, relative, phase, expectedReal) {
  let current;
  try {
    const lexical = fs.lstatSync(file);
    if (lexical.isSymbolicLink() || !lexical.isFile()) {
      throw new Error("Target is no longer a regular file.");
    }
    const real = fs.realpathSync(file);
    const within = path.relative(root, real);
    if (within === ".." || within.startsWith(".." + path.sep) || path.isAbsolute(within)) {
      throw new Error("Target resolves outside the repository.");
    }
    if (!samePath(real, expectedReal)) {
      throw new Error("Target path changed after planning.");
    }
    current = fs.readFileSync(real);
  } catch (error) {
    throw new Error("Cannot verify " + relative + " during " + phase + ": " + error.message);
  }
  if (!current.equals(expected)) {
    throw new Error("Source changed during " + phase + ": " + relative);
  }
}

function atomicReplace(file, expected, replacement, relative, phase, expectedReal) {
  assertBeforeImage(file, expected, relative, phase, expectedReal);
  const directory = path.dirname(file);
  const temporary = path.join(
    directory,
    "." + path.basename(file) + ".export-refactor-" + process.pid + "-" + crypto.randomBytes(12).toString("hex") + ".tmp",
  );
  let descriptor;
  let temporaryExists = false;
  try {
    const mode = fs.statSync(file).mode & 0o7777;
    descriptor = fs.openSync(temporary, "wx", mode);
    temporaryExists = true;
    let offset = 0;
    while (offset < replacement.length) {
      const bytesWritten = fs.writeSync(descriptor, replacement, offset, replacement.length - offset);
      if (bytesWritten <= 0) throw new Error("Short write while preparing " + relative);
      offset += bytesWritten;
    }
    fs.fsyncSync(descriptor);
    if (process.platform !== "win32") fs.fchmodSync(descriptor, mode);
    fs.closeSync(descriptor);
    descriptor = undefined;
    assertBeforeImage(file, expected, relative, phase, expectedReal);
    fs.renameSync(temporary, file);
    temporaryExists = false;
  } catch (error) {
    if (descriptor !== undefined) {
      try { fs.closeSync(descriptor); } catch {}
    }
    if (temporaryExists) {
      try { fs.unlinkSync(temporary); } catch {}
    }
    throw error;
  }
}

function run(name, plan, include = () => true) {
  if (process.argv[2] === "--help") {
    console.log("node scripts/" + name + ".cjs [--check | --apply <pushed SHA>] [--] [paths...]");
    return;
  }
  const { checkpoint, paths } = options(process.argv.slice(2));
  const initialPaths = name === "strip-internal-jsdoc"
    ? [...new Set([...paths, "packages"])]
    : paths;
  if (checkpoint) verifyCheckpoint(checkpoint, initialPaths);
  const indexedFiles = new Set(
    git("ls-files", "-z", "--cached")
      .split("\0")
      .filter(Boolean)
      .map(repoPathKey),
  );
  const reader = workspace(indexedFiles);
  const changes = [];
  const blocked = [];
  const tracked = new Set(pathspecBatches(paths).flatMap((batch) =>
    git("ls-files", "-z", "--cached", "--", ...batch).split("\0").filter(Boolean),
  ));
  for (const relative of tracked) {
    if (!/\.[cm]?tsx?$/u.test(relative) || /\.d\.[cm]?ts$/u.test(relative) ||
        /(?:^|\/)(?:node_modules|dist|generated)\//u.test(relative) || !include(relative)) continue;
    const file = path.resolve(root, relative);
    const item = reader.read(file);
    if (!item || item.tree.parseDiagnostics.length) {
      blocked.push({ file: relative, reason: item ? "Syntax errors" : "Missing source" });
      continue;
    }
    const result = plan(item.tree, reader);
    for (const issue of result.blocked) blocked.push({ file: relative, ...issue });
    if (!result.edits.length) continue;
    const after = applyEdits(item.text, result.edits);
    const reparsed = ts.createSourceFile(file, after, ts.ScriptTarget.Latest, true);
    if (reparsed.parseDiagnostics.length) throw new Error("Planned edits do not parse: " + relative);
    changes.push({
      relative,
      file,
      before: item.text,
      beforeBytes: item.bytes,
      real: item.real,
      after,
      afterBytes: Buffer.from(after, "utf8"),
      count: result.count,
      preview: result.preview,
    });
  }

  const inputSnapshots = reader.snapshots();
  const guardPaths = [...new Set([
    ...paths,
    ...inputSnapshots.flatMap((snapshot) => [snapshot.relative, snapshot.realRelative]),
    ...(name === "strip-internal-jsdoc" ? ["packages"] : []),
  ])];

  let written = 0;
  if (checkpoint) {
    verifyCheckpoint(checkpoint, guardPaths);
    for (const snapshot of inputSnapshots) {
      assertBeforeImage(
        snapshot.file,
        snapshot.bytes,
        snapshot.relative,
        "pre-apply input",
        snapshot.real,
      );
    }
    for (const change of changes) {
      assertBeforeImage(change.file, change.beforeBytes, change.relative, "pre-apply", change.real);
    }
    const applied = [];
    try {
      for (const change of changes) {
        atomicReplace(
          change.file,
          change.beforeBytes,
          change.afterBytes,
          change.relative,
          "apply",
          change.real,
        );
        applied.push(change);
        written++;
      }
    } catch (error) {
      const rollbackFailures = [];
      for (const change of applied.reverse()) {
        try {
          atomicReplace(
            change.file,
            change.afterBytes,
            change.beforeBytes,
            change.relative,
            "rollback",
            change.real,
          );
        } catch (rollbackError) {
          rollbackFailures.push(change.relative + ": " + rollbackError.message);
        }
      }
      const rollback = rollbackFailures.length
        ? "Rollback incomplete: " + rollbackFailures.join("; ")
        : "All completed writes were rolled back.";
      throw new Error(
        "Stopped after writing " + written + " files. " + rollback +
          " Checkpoint: " + checkpoint + ". " + error.message,
      );
    }
  }
  console.log(JSON.stringify({
    mode: checkpoint ? "apply" : "check",
    checkpoint,
    written,
    changes: changes.map(({ relative, count, preview }) => ({ file: relative, count, ...(preview ?? {}) })),
    blocked,
  }, null, 2));
}

module.exports = { applyEdits, pathspecBatches, run };
