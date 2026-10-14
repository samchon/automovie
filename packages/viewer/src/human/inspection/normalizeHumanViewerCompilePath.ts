import path from "node:path";

/**
 * Resolve an absolute compile-input comparison key. Windows comparisons fold case; POSIX comparisons preserve it so distinct source names stay distinct. This lexical policy does not resolve symbolic links or discover per-volume case sensitivity. Both the compiler child and event classifier use it.
 *
 * @evidence contracts/common.md#principled-implementation Absolute paths use the same platform case policy at compile publication and watcher comparison rather than folding POSIX names together.
 * @evidence contracts/common.md#clear-and-simple-design One pure path normalizer owns separators and platform case handling for the two production consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The returned key preserves POSIX spelling and documents that lexical comparison does not establish realpath or per-volume identity.
 * @evidence contracts/common.md#meaningful-documentation The comment states Windows folding, POSIX preservation and the symbolic-link and volume limitations.
 * @evidence contracts/performance.md#efficient-algorithms Resolving, separator replacement and optional case folding take linear work in the path length with no filesystem probes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This stateless conversion performs one requested normalization and retains no result cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The helper returns a string and retains no resource or collection beyond its invocation.
 */
export function normalizeHumanViewerCompilePath(file: string): string {
  const absolute: string = path.resolve(file).replaceAll("\\", "/");
  return process.platform === "win32" ? absolute.toLowerCase() : absolute;
}
