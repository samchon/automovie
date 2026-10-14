import path from "node:path";

/**
 * Write native host separators as slashes without changing filename characters.
 *
 * @evidence contracts/common.md#principled-implementation Replaces only path.sep by slash, so project-relative addresses derived from native filesystem paths have the repository spelling while a literal backslash on POSIX remains a filename character.
 * @evidence contracts/common.md#clear-and-simple-design Project content, generated and render walks use this presentation adapter after deriving their native path; portable admission and containment are separate operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No Unicode normalization, case folding or path-component cleanup changes identity, and the helper does not pretend separator formatting validates ownership.
 * @evidence contracts/common.md#meaningful-documentation States native separator scope and POSIX backslash behavior; output can still require a caller's portable-path validation.
 * @evidence contracts/performance.md#efficient-algorithms Splitting and joining L characters take O(L) time and O(L) temporary/output text; no source or file contents are read.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This small value conversion starts no phase or request work to share; a retained string map would grow with distinct path spellings.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned spelling and temporaries are local; no path registry, handle or task is retained.
 */
export function normalizeAutoMovieProductionProjectSlash(value: string): string { return value.split(path.sep).join("/"); }
