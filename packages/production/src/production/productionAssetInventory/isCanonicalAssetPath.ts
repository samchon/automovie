import path from "node:path";

/**
 * Check lexical project-relative POSIX asset spelling with drive and backslash exclusion.
 *
 * @evidence contracts/common.md#principled-implementation Requires nonabsolute/non-drive spelling, no backslashes, normalization equality and nonempty segments without dot-dot; the single dot is explicitly refused.
 * @evidence contracts/common.md#clear-and-simple-design Asset records and normalized sidecar resolution share this one lexical namespace predicate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This does not implement every Windows device-name/character rule or physical realpath containment; actual declared content ownership stays with the input inventory.
 * @evidence contracts/common.md#meaningful-documentation States the exact lexical admission and its platform/filesystem limits rather than claiming complete portability.
 * @evidence contracts/performance.md#efficient-algorithms Normalization, regular-expression checks and segment splitting scan path text with O(length) temporary storage.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each textual path is judged independently without a filesystem or spelling cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The result retains no path or filesystem handle.
 *
 * @author Samchon
 */
export function isCanonicalAssetPath(value: string): boolean { return path.posix.isAbsolute(value) === false &&
  /^[A-Za-z]:/.test(value) === false &&
  value.includes("\\") === false &&
  value !== "." &&
  path.posix.normalize(value) === value &&
  value.split("/").every((segment: string) : boolean => segment.length > 0 && segment !== ".."); }
