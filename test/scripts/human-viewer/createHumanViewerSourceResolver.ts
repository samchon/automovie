import fs from "node:fs";
import path from "node:path";

/** Extensions a source import may omit, in Vite's probing order for TypeScript sources. */
const EXTENSIONS = [".ts", ".mts", ".tsx", ".js", ".mjs", ".jsx", ".json"];

/** Emitted extensions an import may name for a TypeScript source. */
const EMITTED: Readonly<Record<string, readonly string[]>> = { ".js": [".ts", ".tsx"], ".mjs": [".mts"], ".jsx": [".tsx"] };

/**
 * Resolve the relative and absolute imports of the workspace's own source
 * files from cached directory listings.
 *
 * Profiled on the viewer server: while a candidate loads its modules, Vite's
 * resolver spent 1.5 s of one 3.1 s main-thread stall in native `realpath`,
 * one call per resolved import, because the sources live outside its root
 * and its cached checks cover only the root. The workspace sources are real
 * files, not links, so the real path of an import is the path the directory
 * listings spell: each directory is listed once, and a watcher event under it
 * drops its listing. Names are matched case-insensitively and returned as the
 * listing spells them, so a module has one id however an import spells it.
 * Imports outside the roots, bare specifiers, queries and anything the
 * listings cannot resolve are left to Vite, which resolves them as before.
 *
 * @evidence contracts/common.md#principled-implementation The id is the file's real path read from the directory listing, the same id Vite's realpath gives, without a system call per import.
 * @evidence contracts/common.md#clear-and-simple-design One resolver owns the listings and their invalidation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Never guesses: an import the listings do not resolve goes to Vite unchanged.
 * @evidence contracts/common.md#meaningful-documentation States the profiled cause, why listings give real paths, the case rule and what is left to Vite.
 */
export function createHumanViewerSourceResolver(roots: readonly string[]) {
  const normalize = (file: string): string => path.resolve(file).replaceAll("\\", "/");
  const rootList = roots.map((root) => normalize(root) + "/");
  /** Entries of each listed directory, keyed by lower-case name. */
  const listings = new Map<string, Map<string, fs.Dirent>>();
  const list = (directory: string): Map<string, fs.Dirent> | null => {
    const key = directory.toLowerCase();
    const kept = listings.get(key);
    if (kept !== undefined) return kept;
    try {
      const entries = new Map(fs.readdirSync(directory, { withFileTypes: true })
        .map((entry) => [entry.name.toLowerCase(), entry] as const));
      listings.set(key, entries);
      return entries;
    } catch {
      return null;
    }
  };
  /** The path as the listings spell it, or null when a part is missing or is a link. */
  const canonical = (file: string, kind: "file" | "directory"): string | null => {
    const root = rootList.find((candidate) => file.toLowerCase().startsWith(candidate.toLowerCase()));
    if (root === undefined) return null;
    let current = root.slice(0, -1);
    const parts = file.slice(root.length).split("/").filter((part) => part !== "");
    for (let index = 0; index < parts.length; ++index) {
      const entry = list(current)?.get(parts[index].toLowerCase());
      if (entry === undefined || entry.isSymbolicLink()) return null;
      const last = index === parts.length - 1;
      if (last ? (kind === "file" ? !entry.isFile() : !entry.isDirectory()) : !entry.isDirectory()) return null;
      current += "/" + entry.name;
    }
    return current;
  };
  const resolveFile = (target: string): string | null => {
    const direct = canonical(target, "file");
    if (direct !== null) return direct;
    for (const extension of EXTENSIONS) {
      const found = canonical(target + extension, "file");
      if (found !== null) return found;
    }
    const emitted = path.posix.extname(target);
    for (const extension of EMITTED[emitted] ?? []) {
      const found = canonical(target.slice(0, -emitted.length) + extension, "file");
      if (found !== null) return found;
    }
    if (canonical(target, "directory") !== null)
      for (const extension of EXTENSIONS) {
        const found = canonical(target + "/index" + extension, "file");
        if (found !== null) return found;
      }
    return null;
  };
  return {
    name: "human-viewer-source-resolver",
    enforce: "pre" as const,
    resolveId: (source: string, importer: string | undefined): string | null => {
      if (source.includes("?") || source.includes("\0")) return null;
      let target: string;
      if (source.startsWith("./") || source.startsWith("../")) {
        if (importer === undefined || importer.includes("\0")) return null;
        target = normalize(path.join(path.dirname(importer.split("?")[0]), source));
      } else if (path.isAbsolute(source) && !source.startsWith("/@")) target = normalize(source);
      else return null;
      return resolveFile(target);
    },
    /** A file or directory was added or removed: its directory's listing is read again. */
    changed: (file: string): void => {
      const normalized = normalize(file);
      listings.delete(path.posix.dirname(normalized).toLowerCase());
      listings.delete(normalized.toLowerCase());
    },
  };
}
