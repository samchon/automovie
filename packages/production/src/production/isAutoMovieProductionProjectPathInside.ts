import path from "node:path";

/**
 * Whether a native resolved path is the project root or one lexical descendant.
 *
 * @evidence contracts/common.md#principled-implementation Native path.relative distinguishes another volume, the exact parent and a parent-segment prefix while accepting the root and ordinary descendants; project path/physical fencing helpers compose this relation with lstat and realpath observations.
 * @evidence contracts/common.md#clear-and-simple-design Owns lexical containment only, leaving links, regular-file shape and root generation to physical directory/read guards.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A name beginning with two dots remains a descendant unless the whole segment is parent traversal; no path prefix or drive spelling is manually guessed, and lexical containment alone does not establish physical ownership.
 * @evidence contracts/common.md#meaningful-documentation States root-inclusive native-path semantics and the separate physical fence; inputs are host paths rather than portable manifest addresses.
 * @evidence contracts/performance.md#efficient-algorithms One native relative-path calculation and prefix/absolute checks scale with path text length, with one relative string and no filesystem traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This relation reads only two supplied strings; a memo table would retain path populations while each caller still needs current physical identity checks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one boolean and retains no path table, descriptor or task; native path parsing owns its local string temporaries.
 */
export function isAutoMovieProductionProjectPathInside(root: string, candidate: string): boolean {
  const relative: string = path.relative(root, candidate);
  return relative === "" || (path.isAbsolute(relative) === false && relative !== ".." && relative.startsWith(`..${path.sep}`) === false);
}
