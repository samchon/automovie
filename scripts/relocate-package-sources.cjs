"use strict";

const { execFileSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript-compiler");

const root = path.resolve(__dirname, "..");
const sourcePattern = /\.[cm]?tsx?$/u;
const codePattern = /\.[cm]?[jt]sx?$/u;

function git(...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function readTrackedBytes(relative) {
  const file = path.join(root, relative);
  try {
    const stat = fs.lstatSync(file);
    if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("Tracked path is not a regular file: " + relative);
    return { bytes: fs.readFileSync(file), fromHead: false };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const bytes = execFileSync("git", ["show", "HEAD:" + relative], { cwd: root, encoding: null, maxBuffer: 16 * 1024 * 1024 });
    return { bytes, fromHead: true };
  }
}

function key(relative) {
  const normalized = relative.replaceAll(path.sep, "/");
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function createSourceReferenceMatcher(moves) {
  const sourceReferences = new Map();
  const packageRoots = new Set();
  for (const move of moves) {
    const packageRoot = move.from.slice(0, move.from.indexOf("/src/"));
    const packageSource = move.from.slice(packageRoot.length + 1);
    packageRoots.add(packageRoot);
    if (!sourceReferences.has(packageRoot)) sourceReferences.set(packageRoot, new Set());
    for (const reference of [move.from, packageSource]) {
      const extension = path.posix.extname(reference);
      const stem = extension ? reference.slice(0, -extension.length) : reference;
      sourceReferences.get(packageRoot).add(reference);
      sourceReferences.get(packageRoot).add(stem);
      if (extension === ".ts") sourceReferences.get(packageRoot).add(stem + ".js");
      else if (extension === ".tsx") sourceReferences.get(packageRoot).add(stem + ".jsx");
      else if (extension === ".mts") sourceReferences.get(packageRoot).add(stem + ".mjs");
      else if (extension === ".cts") sourceReferences.get(packageRoot).add(stem + ".cjs");
    }
  }
  const patterns = new Map([...sourceReferences].map(([packageRoot, references]) => [
    packageRoot,
    new RegExp([...references].map((reference) => escapeRegExp(reference) + "(?![A-Za-z0-9_.])").join("|"), "u"),
  ]));
  return (value) => {
    const normalized = value.replaceAll("\\", "/");
    if (!normalized.includes("src/")) return false;
    let candidates = normalized.includes("packages/")
      ? [...packageRoots].filter((packageRoot) => normalized.includes(packageRoot))
      : [];
    if (!candidates.length) candidates = [...patterns.keys()];
    return candidates.some((packageRoot) => patterns.get(packageRoot).test(normalized));
  };
}

function repoPath(value) {
  if (typeof value !== "string" || !value || path.isAbsolute(value) || value.includes("\\"))
    throw new Error("Manifest paths must be repository-relative slash paths.");
  const normalized = path.posix.normalize(value);
  if (normalized !== value || normalized === "." || normalized === ".." || normalized.startsWith("../") || !normalized.startsWith("packages/"))
    throw new Error("Path must be a normalized path beneath packages/: " + value);
  if (!sourcePattern.test(value) || /\.d\.[cm]?ts$/u.test(value))
    throw new Error("Only non-declaration TypeScript source paths can be relocated: " + value);
  return value;
}

function parseArgs(args) {
  let apply = false;
  let checkpoint;
  if (args[0] === "--apply") {
    apply = true;
    checkpoint = args[1];
    args = args.slice(2);
    if (!/^[a-f0-9]{40}$/u.test(checkpoint ?? "")) throw new Error("--apply requires the full pushed checkpoint SHA.");
  } else if (args[0] === "--help") {
    console.log("node scripts/relocate-package-sources.cjs [--apply <pushed SHA>] <manifest.json | ->");
    return undefined;
  }
  if (args.length !== 1) throw new Error("Pass one JSON manifest containing {moves:[{from,to}]} or use - for stdin.");
  return { apply, checkpoint, manifest: args[0] === "-" ? "-" : path.resolve(root, args[0]) };
}

function readManifestText(text) {
  const value = JSON.parse(text);
  if (!value || !Array.isArray(value.moves) || !value.moves.length) throw new Error("Manifest must contain a non-empty moves array.");
  const sources = new Set();
  const destinations = new Set();
  const moves = value.moves.map((entry) => {
    if (!entry || typeof entry !== "object") throw new Error("Each move must contain from and to paths.");
    const from = repoPath(entry.from);
    const to = repoPath(entry.to);
    const sourcePackage = from.slice(0, from.indexOf("/src/"));
    const destinationPackage = to.slice(0, to.indexOf("/src/"));
    if (!sourcePackage.startsWith("packages/") || sourcePackage !== destinationPackage || !from.startsWith(sourcePackage + "/src/") || !to.startsWith(sourcePackage + "/src/"))
      throw new Error("Moves must stay within the same package src/ tree: " + from + " -> " + to);
    if (key(from) === key(to)) throw new Error("Source and destination must differ: " + from);
    if (sources.has(key(from))) throw new Error("Duplicate move source: " + from);
    if (destinations.has(key(to))) throw new Error("Duplicate move destination: " + to);
    sources.add(key(from));
    destinations.add(key(to));
    return { from, to };
  });
  for (const move of moves) if (sources.has(key(move.to))) throw new Error("Move cycles are not supported: " + move.to);
  return moves;
}

function verifyCheckpoint(checkpoint, paths) {
  if (git("rev-parse", "HEAD").trim() !== checkpoint) throw new Error("HEAD is not the requested checkpoint.");
  let batch = [];
  let size = 0;
  const dirty = [];
  function checkBatch() {
    if (!batch.length) return;
    const result = git("status", "--porcelain=v1", "--untracked-files=all", "--", ...batch).trim();
    if (result) dirty.push(result);
    batch = [];
    size = 0;
  }
  for (const relative of new Set(paths)) {
    const pathspec = ":(literal)" + relative;
    if (batch.length >= 200 || size + pathspec.length > 12000) checkBatch();
    batch.push(pathspec);
    size += pathspec.length + 1;
  }
  checkBatch();
  if (dirty.length) throw new Error("Affected paths are not clean:\n" + dirty.join("\n"));
  const branch = git("symbolic-ref", "--short", "HEAD").trim();
  const remote = git("config", "--get", "branch." + branch + ".remote").trim();
  const ref = git("config", "--get", "branch." + branch + ".merge").trim();
  if (!remote || remote === "." || !ref.startsWith("refs/heads/")) throw new Error("The branch needs a pushed upstream branch.");
  const upstream = git("ls-remote", "--exit-code", "--", remote, ref).trim().split(/\s+/u)[0];
  if (upstream !== checkpoint) throw new Error("The upstream branch does not point to the checkpoint.");
}

function moduleLiterals(tree) {
  const result = [];
  function add(node) {
    if (ts.isStringLiteral(node)) result.push(node);
    else if (ts.isNoSubstitutionTemplateLiteral(node)) result.push(node);
    else if (ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal)) result.push(node.literal);
  }
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) add(node.moduleSpecifier);
    else if (ts.isImportTypeNode(node)) add(node.argument);
    else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) add(node.moduleReference.expression);
    else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments.length >= 1) add(node.arguments[0]);
    else if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "require" && node.arguments.length === 1) add(node.arguments[0]);
    else if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "resolve" && ts.isIdentifier(node.expression.expression) && node.expression.expression.text === "require" && node.arguments.length === 1) add(node.arguments[0]);
    else if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "resolve" && ts.isMetaProperty(node.expression.expression) && node.expression.expression.keywordToken === ts.SyntaxKind.ImportKeyword && node.arguments.length === 1) add(node.arguments[0]);
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return result;
}

function resolver(files) {
  return function resolve(importer, specifier) {
    if (!specifier.startsWith(".")) return undefined;
    const suffixAt = specifier.search(/[?#]/u);
    const pathSpecifier = suffixAt < 0 ? specifier : specifier.slice(0, suffixAt);
    const base = path.resolve(path.dirname(importer), pathSpecifier);
    const extension = path.extname(base);
    const replacements = { ".js": [".ts", ".tsx", ".d.ts", ".js"], ".jsx": [".tsx", ".jsx"], ".mjs": [".mts", ".d.mts", ".mjs"], ".cjs": [".cts", ".d.cts", ".cjs"] };
    const candidates = replacements[extension]
      ? replacements[extension].map((ending) => base.slice(0, -extension.length) + ending)
      : [base, ...[".ts", ".tsx", ".mts", ".cts", ".d.ts", ".d.mts", ".d.cts", ".js", ".jsx", ".mjs", ".cjs", "/index.ts", "/index.tsx", "/index.d.ts", "/index.js", "/index.jsx"].map((ending) => base + ending)];
    const resolved = candidates.find((candidate) => files.has(key(path.relative(root, candidate).replaceAll(path.sep, "/"))));
    return resolved ? path.relative(root, resolved).replaceAll(path.sep, "/") : undefined;
  };
}

function specifierFor(importer, target, oldSpecifier, preserveIndex = false) {
  let targetName = target;
  const suffixAt = oldSpecifier.search(/[?#]/u);
  const pathSpecifier = suffixAt < 0 ? oldSpecifier : oldSpecifier.slice(0, suffixAt);
  const suffix = suffixAt < 0 ? "" : oldSpecifier.slice(suffixAt);
  const oldExtension = path.posix.extname(pathSpecifier);
  const targetExtension = path.posix.extname(target);
  if (oldExtension && oldExtension !== targetExtension) targetName = target.slice(0, -targetExtension.length) + oldExtension;
  else if (!oldExtension) {
    targetName = targetName.replace(/(?:\.d)?\.[cm]?[jt]sx?$/u, "");
    if (!preserveIndex) targetName = targetName.replace(/\/index$/u, "");
  }
  let relative = path.posix.relative(path.posix.dirname(importer), targetName);
  if (!relative.startsWith(".")) relative = "./" + relative;
  return relative + suffix;
}

function plan(moves) {
  const allTrackedPaths = git("ls-files", "-z", "--cached").split("\0").filter(Boolean);
  const ignoredCodePath = (relative) => !codePattern.test(relative) || /(?:^|\/)(?:node_modules|dist|generated|\.agents)\//u.test(relative);
  const untrackedCodePaths = git("ls-files", "--others", "--exclude-standard", "-z").split("\0").filter((relative) => !ignoredCodePath(relative) && /^(?:packages|test|config|website|experimental)\//u.test(relative));
  const trackedPaths = [...new Set([...allTrackedPaths.filter((relative) => !ignoredCodePath(relative)), ...untrackedCodePaths])];
  const trackedKeys = new Set(allTrackedPaths.map(key));
  const tracked = new Set([...trackedKeys, ...untrackedCodePaths.map(key)]);
  const moveBySource = new Map(moves.map((move) => [key(move.from), move]));
  const containsMovedPath = createSourceReferenceMatcher(moves);
  for (const move of moves) {
    const source = path.join(root, move.from);
    const target = path.join(root, move.to);
    const stat = fs.lstatSync(source);
    if (!stat.isFile() || stat.isSymbolicLink() || !tracked.has(key(move.from))) throw new Error("Move source must be a tracked regular file: " + move.from);
    if (fs.existsSync(target) || tracked.has(key(move.to))) throw new Error("Move destination already exists or remains tracked: " + move.to);
    for (let parent = path.dirname(target); parent !== root && parent.startsWith(root + path.sep); parent = path.dirname(parent)) {
      if (!fs.existsSync(parent)) continue;
      const parentStat = fs.lstatSync(parent);
      if (parentStat.isSymbolicLink() || !parentStat.isDirectory()) throw new Error("Destination parent is not a regular directory: " + move.to);
      const parentReal = fs.realpathSync(parent);
      const parentRelative = path.relative(root, parentReal);
      if (parentRelative === ".." || parentRelative.startsWith(".." + path.sep) || path.isAbsolute(parentRelative)) throw new Error("Destination parent resolves outside repository: " + move.to);
    }
  }
  const virtual = new Set(tracked);
  for (const move of moves) { virtual.delete(key(move.from)); virtual.add(key(move.to)); }
  const movedDestinationKeys = new Set(moves.map((move) => key(move.to)));
  const resolveBefore = resolver(tracked);
  const resolveAfter = resolver(virtual);
  const editsByFile = new Map();
  const changedImports = [];
  const blockers = [];
  const jsonFiles = allTrackedPaths.filter((relative) => /\.jsonc?$/u.test(relative));
  const inputSnapshots = [];
  for (const move of moves) {
    const packageRoot = move.from.slice(0, move.from.indexOf("/src/"));
    if (packageRoot !== move.from && packageRoot.startsWith("packages/")) {
      const sourceRelative = move.from.slice(packageRoot.length + "/src/".length);
      const destinationRelative = move.to.slice(packageRoot.length + "/src/".length);
      const predicateFrom = path.join(root, packageRoot, "predicate", sourceRelative.replace(/\.[cm]?tsx?$/u, ".md"));
      const predicateTo = path.join(root, packageRoot, "predicate", destinationRelative.replace(/\.[cm]?tsx?$/u, ".md"));
      const predicateFromRelative = path.relative(root, predicateFrom).replaceAll(path.sep, "/");
      const predicateToRelative = path.relative(root, predicateTo).replaceAll(path.sep, "/");
      if (fs.existsSync(predicateFrom) || tracked.has(key(predicateFromRelative))) blockers.push({ path: predicateFromRelative, reason: "Associated predicate file and declaration address need a coordinated move." });
      if (fs.existsSync(predicateTo) || tracked.has(key(predicateToRelative))) blockers.push({ path: predicateToRelative, reason: "Predicate destination already exists." });
    }
  }
  for (const jsonPath of jsonFiles) {
    const contents = readTrackedBytes(jsonPath).bytes.toString("utf8");
    if (!containsMovedPath(contents)) continue;
    const isPackageManifest = /(?:^|\/)package\.json$/u.test(jsonPath);
    const reason = isPackageManifest && JSON.stringify(JSON.parse(contents).exports ?? {}).length > 2
      ? "Package export or source path in package.json needs a coordinated update."
      : "JSON path string references a moved source and needs a coordinated update.";
    blockers.push({ path: jsonPath, reason });
  }
  for (const relative of trackedPaths) {
    if (!codePattern.test(relative) || /(?:^|\/)(?:node_modules|dist|generated)\//u.test(relative)) continue;
    const diskPath = path.join(root, relative);
    if (!fs.existsSync(diskPath) && !trackedKeys.has(key(relative))) throw new Error("Untracked source disappeared during scan: " + relative);
    if (!fs.existsSync(diskPath) && moveBySource.has(key(relative))) throw new Error("Move source preimage is missing from the worktree: " + relative);
    const { bytes, fromHead } = readTrackedBytes(relative);
    const text = bytes.toString("utf8");
    if (!bytes.equals(Buffer.from(text, "utf8"))) throw new Error("Invalid UTF-8 source: " + relative);
    inputSnapshots.push({ path: relative, bytes, fromHead });
    const tree = ts.createSourceFile(diskPath, text, ts.ScriptTarget.Latest, true);
    if (tree.parseDiagnostics.length) throw new Error("Cannot safely inspect source syntax: " + relative);
    const importerMove = moveBySource.get(key(relative));
    const importerAfter = importerMove?.to ?? relative;
    const edits = [];
    const moduleNodes = moduleLiterals(tree);
    const moduleStarts = new Set(moduleNodes.map((node) => node.getStart(tree)));
    for (const literal of moduleNodes) {
      const oldSpecifier = literal.text;
      if (!oldSpecifier.startsWith(".")) continue;
      const resolved = resolveBefore(relative, oldSpecifier);
      if (/\.[cm]?jsx?$/u.test(relative)) {
        const resolvedAfter = resolveAfter(relative, oldSpecifier);
        const expectedAfter = resolved ? (moveBySource.get(key(resolved))?.to ?? resolved) : undefined;
        if ((resolved && (!resolvedAfter || key(resolvedAfter) !== key(expectedAfter))) || (!resolved && resolvedAfter))
          blockers.push({ path: relative, reason: "JavaScript module binding changes under relocation: " + oldSpecifier });
        continue;
      }
      if (!resolved) {
        if (importerMove) throw new Error("Cannot rebase unresolved relative specifier " + oldSpecifier + " in " + relative);
        const newlyResolved = resolveAfter(relative, oldSpecifier);
        if (newlyResolved && movedDestinationKeys.has(key(newlyResolved)))
          blockers.push({ path: relative, reason: "A previously unresolved specifier would resolve to a moved source: " + oldSpecifier });
        continue;
      }
      const targetMove = moveBySource.get(key(resolved));
      const targetAfter = targetMove?.to ?? resolved;
      let nextSpecifier = oldSpecifier;
      let checked = resolveAfter(importerAfter, oldSpecifier);
      if (!checked || key(checked) !== key(targetAfter)) {
        nextSpecifier = specifierFor(importerAfter, targetAfter, oldSpecifier);
        checked = resolveAfter(importerAfter, nextSpecifier);
        if (!checked || key(checked) !== key(targetAfter)) {
          nextSpecifier = specifierFor(importerAfter, targetAfter, oldSpecifier, true);
          checked = resolveAfter(importerAfter, nextSpecifier);
        }
        if (!checked || key(checked) !== key(targetAfter))
          throw new Error("Rebased specifier does not resolve to its original target: " + relative + " " + oldSpecifier + " -> " + nextSpecifier);
      }
      if (nextSpecifier === oldSpecifier) continue;
      edits.push({ start: literal.getStart(tree) + 1, end: literal.getEnd() - 1, text: nextSpecifier });
      changedImports.push({ file: relative, before: oldSpecifier, after: nextSpecifier, target: targetAfter });
    }
    const allStrings = [];
    function findStrings(node) {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) allStrings.push(node);
      ts.forEachChild(node, findStrings);
    }
    findStrings(tree);
    for (const literal of allStrings) {
      if (moduleStarts.has(literal.getStart(tree))) continue;
      const value = literal.text;
      if (containsMovedPath(value)) {
        blockers.push({ path: relative, reason: "Non-module string literal contains a moved source path: " + value });
      } else if (value.startsWith(".")) {
        const resolved = resolveBefore(relative, value);
        if (resolved && (importerMove || moveBySource.has(key(resolved)))) blockers.push({ path: relative, reason: "Runtime/path string needs a coordinated relocation: " + value });
      }
    }
    if (edits.length) editsByFile.set(relative, edits);
  }
  const changes = [];
  for (const [relative, edits] of editsByFile) {
    const file = path.join(root, relative);
    const before = inputSnapshots.find((input) => key(input.path) === key(relative))?.bytes ?? fs.readFileSync(file);
    const source = before.toString("utf8");
    let after = source;
    for (const edit of [...edits].sort((a, b) => b.start - a.start)) after = after.slice(0, edit.start) + edit.text + after.slice(edit.end);
    const tree = ts.createSourceFile(file, after, ts.ScriptTarget.Latest, true);
    if (tree.parseDiagnostics.length) throw new Error("Planned imports do not parse: " + relative);
    changes.push({
      path: moveBySource.get(key(relative))?.to ?? relative,
      origin: relative,
      before,
      after: Buffer.from(after, "utf8"),
    });
  }
  const moveRows = moves.map((move) => ({
    from: move.from,
    to: move.to,
    before: fs.readFileSync(path.join(root, move.from)),
    sha256: crypto.createHash("sha256").update(fs.readFileSync(path.join(root, move.from))).digest("hex"),
  }));
  return { moves: moveRows, imports: changedImports, changes, blockers, inputs: inputSnapshots };
}

function assertSafeRepositoryPath(file) {
  const absolute = path.resolve(file);
  const within = path.relative(root, absolute);
  if (within === ".." || within.startsWith(".." + path.sep) || path.isAbsolute(within)) throw new Error("Path is outside the repository: " + file);
  for (let current = absolute; current !== root && current.startsWith(root + path.sep); current = path.dirname(current)) {
    if (!fs.existsSync(current)) continue;
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) throw new Error("Path traverses a symlink: " + file);
    if (current !== absolute && !stat.isDirectory()) throw new Error("Path parent is not a directory: " + file);
  }
  return absolute;
}

function verifyFile(relative, expected) {
  const file = path.join(root, relative);
  assertSafeRepositoryPath(file);
  const stat = fs.lstatSync(file);
  if (stat.isSymbolicLink() || !stat.isFile() || !fs.readFileSync(file).equals(expected)) throw new Error("File changed after planning: " + relative);
}

function atomicWrite(relative, expected, replacement) {
  const file = path.join(root, relative);
  verifyFile(relative, expected);
  const temp = path.join(path.dirname(file), "." + path.basename(file) + ".relocate-" + process.pid + "-" + crypto.randomBytes(8).toString("hex") + ".tmp");
  let fd;
  try {
    const mode = fs.statSync(file).mode & 0o7777;
    fd = fs.openSync(temp, "wx", mode);
    fs.writeFileSync(fd, replacement);
    fs.fsyncSync(fd);
    if (process.platform !== "win32") fs.fchmodSync(fd, mode);
    fs.closeSync(fd); fd = undefined;
    verifyFile(relative, expected);
    fs.renameSync(temp, file);
  } catch (error) {
    if (fd !== undefined) try { fs.closeSync(fd); } catch {}
    try { fs.unlinkSync(temp); } catch {}
    throw error;
  }
}

function apply(planResult, checkpoint) {
  if (planResult.blockers.length) throw new Error("Apply blocked by unresolved package paths:\n" + planResult.blockers.map(({ path, reason }) => path + ": " + reason).join("\n"));
  const guardedPaths = [...new Set([
    ...planResult.moves.flatMap(({ from, to }) => [from, to]),
    ...planResult.changes.map(({ path }) => path),
  ])];
  verifyCheckpoint(checkpoint, guardedPaths);
  for (const input of planResult.inputs) if (!input.fromHead) verifyFile(input.path, input.bytes);
  for (const move of planResult.moves) {
    verifyFile(move.from, move.before);
    if (fs.existsSync(path.join(root, move.to))) throw new Error("Destination appeared after planning: " + move.to);
  }
  for (const change of planResult.changes) verifyFile(change.origin, change.before);
  const moved = [];
  const createdDirectories = [];
  const edited = [];
  try {
    for (const move of planResult.moves) {
      const from = path.join(root, move.from);
      const to = path.join(root, move.to);
      const missingDirectories = [];
      for (let directory = path.dirname(to); !fs.existsSync(directory); directory = path.dirname(directory)) missingDirectories.push(directory);
      for (const directory of missingDirectories.reverse()) {
        assertSafeRepositoryPath(directory);
        fs.mkdirSync(directory);
        createdDirectories.push(directory);
      }
      assertSafeRepositoryPath(to);
      const bytes = move.before;
      verifyFile(move.from, bytes);
      const temp = to + ".relocate-" + process.pid + "-" + crypto.randomBytes(8).toString("hex") + ".tmp";
      let descriptor;
      try {
        const mode = fs.statSync(from).mode & 0o7777;
        descriptor = fs.openSync(temp, "wx", mode);
        fs.writeFileSync(descriptor, bytes);
        fs.fsyncSync(descriptor);
        if (process.platform !== "win32") fs.fchmodSync(descriptor, mode);
        fs.closeSync(descriptor);
        descriptor = undefined;
        fs.linkSync(temp, to);
        moved.push({ ...move, bytes });
        fs.unlinkSync(temp);
      } catch (error) {
        if (descriptor !== undefined) try { fs.closeSync(descriptor); } catch {}
        try { fs.unlinkSync(temp); } catch {}
        throw error;
      }
      if (!fs.readFileSync(to).equals(bytes)) throw new Error("Destination verification failed: " + move.to);
      verifyFile(move.from, bytes);
      fs.unlinkSync(from);
    }
    for (const change of planResult.changes) {
      atomicWrite(change.path, change.before, change.after);
      edited.push(change);
    }
  } catch (error) {
    const failures = [];
    for (const change of edited.reverse()) try { atomicWrite(change.path, change.after, change.before); } catch (rollback) { failures.push(change.path + ": " + rollback.message); }
    for (const move of moved.reverse()) {
      try {
        const from = path.join(root, move.from), to = path.join(root, move.to);
        if (!fs.readFileSync(to).equals(move.bytes)) throw new Error("Move rollback preimage changed.");
        if (fs.existsSync(from)) {
          if (!fs.readFileSync(from).equals(move.bytes)) throw new Error("Original source changed during rollback.");
          fs.unlinkSync(to);
        } else fs.renameSync(to, from);
      } catch (rollback) { failures.push(move.from + ": " + rollback.message); }
    }
    for (const directory of createdDirectories.reverse()) {
      try { fs.rmdirSync(directory); } catch (rollback) { if (rollback.code !== "ENOTEMPTY" && rollback.code !== "ENOENT") failures.push(directory + ": " + rollback.message); }
    }
    throw new Error("Relocation stopped. " + (failures.length ? "Rollback incomplete: " + failures.join("; ") : "Completed writes were rolled back.") + " " + error.message);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args) return;
  const manifestText = args.manifest === "-" ? fs.readFileSync(0, "utf8") : fs.readFileSync(args.manifest, "utf8");
  const moves = readManifestText(manifestText);
  const result = plan(moves);
  if (args.apply) apply(result, args.checkpoint);
  console.log(JSON.stringify({
    mode: args.apply ? "apply" : "dry-run",
    moves: result.moves.map(({ from, to, sha256 }) => ({ from, to, sha256 })),
    importChanges: result.imports,
    blockers: result.blockers,
    sourceFileChanges: result.changes.map((change) => change.path),
  }, null, 2));
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = { createSourceReferenceMatcher, moduleLiterals, plan, readManifestText, repoPath, resolver, specifierFor };
