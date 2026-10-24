import { canonicalProductionPath as canonical } from "../../canonicalProductionPath";

/**
 * Authored directories in another package remain unknown even when empty.
 *
 * @evidence contracts/common.md#principled-implementation Canonical slash-delimited paths are matched against the reserved body, revision, naturalness, review and detached-evidence layer trees, including directories without files; recognition is lexical and does not reopen the filesystem.
 * @evidence contracts/common.md#clear-and-simple-design The reserved-tree predicate is separate from local ownership so callers can reject a foreign production boundary rather than silently assigning it to this package.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The literal directory and layer names are the production layout contract; an unrecognized path is not made authored by a fixture or consumer label.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies foreign and empty authored directories, and the pattern enumerates the reserved production trees.
 * @evidence contracts/performance.md#efficient-algorithms One path normalization and one anchored-segment regular-expression search cost O(p) time and transient string space for path length p.
 * @evidence contracts/performance.md#reuse-equivalent-work This predicate reuses canonicalProductionPath and the shared layout vocabulary; it has no request cache, so each supplied address is classified independently.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the normalized path and match result are call-local; no filesystem handle, task or growing collection is acquired.
 */
export function authoredBoundary(filename: string): boolean {
  return /\/docs\/(?:(?:body|revision|naturalness|review\/(?:draft|final))\/(?:settings|treatments|scripts|screenplay)|evidence\/(?:construction|naturalness)\/(?:files|units)\/(?:settings|treatments|scripts|screenplay))(?:\/|$)/.test(
    canonical(filename),
  );
}
