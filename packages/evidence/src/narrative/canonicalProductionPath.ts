import path from "node:path";

/**
 * Normalizes path spelling without consulting a mutable filesystem.
 *
 * @evidence contracts/common.md#principled-implementation Lexical normalization removes Windows namespace prefixes, normalizes separators and applies Windows case folding only to drive-qualified paths; it deliberately does not resolve symlinks or read mutable metadata.
 * @evidence contracts/common.md#clear-and-simple-design The small path-format adapter isolates portable lexical identity from evaluation-time physical resolution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Windows spelling rules are a supported platform difference, not a consumer exception; physical equivalence is not guessed from content or a failed realpath.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes normalized spelling from filesystem identity; callers requiring physical aliases use the capture layer.
 * @evidence contracts/performance.md#efficient-algorithms Time and temporary string space grow with path length through replacement and path normalization passes; path resolution also uses the current working directory for relative non-drive inputs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This scalar spelling conversion coordinates no requests or effectful work, so it has no shared cache or invalidation scheme.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The function owns only temporary strings and returns one normalized path; it opens no handle or task and retains no module state.
 */
export function canonicalProductionPath(filename: string): string {
  const portable: string = filename
    .replaceAll("\\", "/")
    .replace(/^\/\/[?.]\/UNC\//iu, "//")
    .replace(/^\/\/[?.]\//u, "");
  const windows: boolean = /^[A-Za-z]:\//u.test(portable);
  const paths: typeof path = windows ? path.win32 : path;
  const absolute: string = windows
    ? paths.normalize(portable)
    : paths.resolve(portable);
  const normalized: string = absolute
    .replaceAll("\\", "/")
    .replace(/\/+$/u, (suffix: string): string =>
      absolute.length === suffix.length || /^[A-Za-z]:[\\/]$/u.test(absolute)
        ? "/"
        : "",
    );
  return /^[A-Za-z]:\//u.test(normalized)
    ? normalized.toLowerCase()
    : normalized;
}
