"use strict";

const { execFileSync } = require("node:child_process");
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

function verifyCheckpoint(checkpoint) {
  if (git("rev-parse", "HEAD").trim() !== checkpoint) {
    throw new Error("HEAD is not the requested checkpoint.");
  }
  if (git("status", "--porcelain", "--untracked-files=normal").trim()) {
    throw new Error("Commit and push the worktree before applying this change.");
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

function workspace() {
  const files = new Map();
  function read(file) {
    if (files.has(file)) return files.get(file);
    if (!fs.existsSync(file)) return undefined;
    const real = fs.realpathSync(file);
    const relative = path.relative(root, real);
    if (relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative)) return undefined;
    if (!fs.statSync(real).isFile()) return undefined;
    const bytes = fs.readFileSync(real);
    const text = bytes.toString("utf8");
    if (!bytes.equals(Buffer.from(text, "utf8"))) throw new Error("Invalid UTF-8: " + relative);
    const tree = ts.createSourceFile(real, text, ts.ScriptTarget.Latest, true);
    const result = { text, tree };
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

  return { read, resolve };
}

function run(name, plan, include = () => true) {
  if (process.argv[2] === "--help") {
    console.log("node scripts/" + name + ".cjs [--check | --apply <pushed SHA>] [--] [paths...]");
    return;
  }
  const { checkpoint, paths } = options(process.argv.slice(2));
  if (checkpoint) verifyCheckpoint(checkpoint);
  const reader = workspace();
  const changes = [];
  const blocked = [];
  const tracked = new Set(git("ls-files", "-z", "--cached", "--", ...paths).split("\0").filter(Boolean));
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
    changes.push({ relative, file, before: item.text, after, count: result.count });
  }

  let written = 0;
  if (checkpoint) {
    verifyCheckpoint(checkpoint);
    for (const change of changes) {
      if (fs.readFileSync(change.file, "utf8") !== change.before) {
        throw new Error("Worktree changed while planning: " + change.relative);
      }
    }
    try {
      for (const change of changes) {
        if (fs.readFileSync(change.file, "utf8") !== change.before) {
          throw new Error("Worktree changed during apply: " + change.relative);
        }
        fs.writeFileSync(change.file, change.after, "utf8");
        written++;
      }
    } catch (error) {
      throw new Error("Stopped after writing " + written + " files. Checkpoint: " + checkpoint + ". " + error.message);
    }
  }
  console.log(JSON.stringify({
    mode: checkpoint ? "apply" : "check",
    checkpoint,
    written,
    changes: changes.map(({ relative, count }) => ({ file: relative, count })),
    blocked,
  }, null, 2));
}

module.exports = { applyEdits, run };
