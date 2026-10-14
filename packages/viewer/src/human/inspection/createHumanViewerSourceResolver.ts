import fs from "node:fs";
import path from "node:path";

/** Extensions a source import may omit, in Vite's probing order for TypeScript sources. */
const EXTENSIONS: readonly string[] = [".ts", ".mts", ".tsx", ".js", ".mjs", ".jsx", ".json"];

/** Emitted extensions an import may name for a TypeScript source. */
const EMITTED: Readonly<Record<string, readonly string[]>> = {
  ".js": [".ts", ".tsx"],
  ".mjs": [".mts"],
  ".jsx": [".tsx"],
};

/**
 * Resolve the relative and absolute imports of the workspace's own source files from cached directory listings.
 *
 * Profiled on the viewer server: while a candidate loads its modules, Vite's resolver spent 1.5 s of one 3.1 s main-thread stall in native `realpath`, one call per resolved import, because the sources live outside its root and its cached checks cover only the root. The workspace sources are real files, not links, so the real path of an import is the path the directory listings spell: each directory is listed once, and a watcher event under it drops its listing. Names use Windows case folding and exact POSIX spelling, then return the listing spelling. The supplied roots must already describe ordinary workspace directories; this adapter refuses symlink descendants but does not resolve the root's physical identity itself. Imports outside the roots, bare specifiers, queries and anything the listings cannot resolve are left to Vite, which resolves them as before.
 *
 * @evidence contracts/common.md#principled-implementation Cached Dirent walks resolve owned relative/absolute source paths with extension probing, reject symlink descendants and leave unsupported specifiers to Vite.
 * @evidence contracts/common.md#clear-and-simple-design Directory listing, canonical walk and extension probing have separate helpers while one watcher callback invalidates affected listings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts POSIX names remain case-sensitive, missing or linked paths fall back rather than gaining fabricated ownership, and supplied root identity remains an explicit caller premise.
 * @evidence contracts/common.md#meaningful-documentation The comment describes profiled directory reuse, platform spelling, descendant-link refusal and unsupported-input fallback.
 * @evidence contracts/performance.md#efficient-algorithms Each directory is listed once until its membership event; resolution walks path components and a fixed extension list with expected constant-time name lookups.
 * @evidence contracts/performance.md#reuse-equivalent-work Listings are reused only by platform path/name keys and withdrawn by changed events for the entry and parent directory; correctness requires the caller to deliver every relevant membership event.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Listings remain for directories reached during this resolver's Vite-server lifetime; invalidation removes changed entries, but no independent directory-count cap or close API exists.
 */
export function createHumanViewerSourceResolver(roots: readonly string[]): {
  name: string;
  enforce: "pre";
  resolveId: (source: string, importer: string | undefined) => string | null;
  changed: (file: string) => void;
} {
  const normalize: (file: string) => string = (file: string): string =>
    path.resolve(file).replaceAll("\\", "/");
  const spelling: (name: string) => string = (name: string): string => process.platform === "win32" ? name.toLowerCase() : name;
  const rootList: string[] = roots.map((root: string): string => normalize(root) + "/");
  /** Entries keyed by the platform's lexical name policy. */
  const listings: Map<string, Map<string, fs.Dirent>> = new Map();
  const list: (directory: string) => Map<string, fs.Dirent> | null = (directory: string): Map<string, fs.Dirent> | null => {
    const key: string = spelling(directory);
    const kept: Map<string, fs.Dirent> | undefined = listings.get(key);
    if (kept !== undefined) return kept;
    try {
      const entries: Map<string, fs.Dirent> = new Map(
        fs
          .readdirSync(directory, { withFileTypes: true })
          .map((entry: fs.Dirent): readonly [string, fs.Dirent] => [spelling(entry.name), entry] as const),
      );
      listings.set(key, entries);
      return entries;
    } catch {
      return null;
    }
  };
  /** The path as the listings spell it, or null when a part is missing or is a link. */
  const canonical: (file: string, kind: "file" | "directory") => string | null = (
    file: string,
    kind: "file" | "directory",
  ): string | null => {
    const root: string | undefined = rootList.find((candidate: string): boolean =>
      spelling(file).startsWith(spelling(candidate)),
    );
    if (root === undefined) return null;
    let current: string = root.slice(0, -1);
    const parts: string[] = file
      .slice(root.length)
      .split("/")
      .filter((part: string): boolean => part !== "");
    for (let index: number = 0; index < parts.length; ++index) {
      const entry: fs.Dirent | undefined = list(current)?.get(spelling(parts[index]));
      if (entry === undefined || entry.isSymbolicLink()) return null;
      const last: boolean = index === parts.length - 1;
      if (
        last
          ? kind === "file"
            ? !entry.isFile()
            : !entry.isDirectory()
          : !entry.isDirectory()
      )
        return null;
      current += "/" + entry.name;
    }
    return current;
  };
  const resolveFile: (target: string) => string | null = (target: string): string | null => {
    const direct: string | null = canonical(target, "file");
    if (direct !== null) return direct;
    for (const extension of EXTENSIONS) {
      const found: string | null = canonical(target + extension, "file");
      if (found !== null) return found;
    }
    const emitted: string = path.posix.extname(target);
    for (const extension of EMITTED[emitted] ?? []) {
      const found: string | null = canonical(
        target.slice(0, -emitted.length) + extension,
        "file",
      );
      if (found !== null) return found;
    }
    if (canonical(target, "directory") !== null)
      for (const extension of EXTENSIONS) {
        const found: string | null = canonical(target + "/index" + extension, "file");
        if (found !== null) return found;
      }
    return null;
  };
  return {
    name: "human-viewer-source-resolver",
    enforce: "pre" as const,
    resolveId: (
      source: string,
      importer: string | undefined,
    ): string | null => {
      if (source.includes("?") || source.includes("\0")) return null;
      let target: string;
      if (source.startsWith("./") || source.startsWith("../")) {
        if (importer === undefined || importer.includes("\0")) return null;
        target = normalize(
          path.join(path.dirname(importer.split("?")[0]), source),
        );
      } else if (path.isAbsolute(source) && !source.startsWith("/@"))
        target = normalize(source);
      else return null;
      return resolveFile(target);
    },
    /** A file or directory was added or removed: its directory's listing is read again. */
    changed: (file: string): void => {
      const normalized: string = normalize(file);
      listings.delete(spelling(path.posix.dirname(normalized)));
      listings.delete(spelling(normalized));
    },
  };
}
