import type { IAutoMovieReferenceIdentity } from "../structures/IAutoMovieReferenceIdentity";
import { fail } from "./fail";

/**
 * Admit a non-directory inventory observation before its name can be published.
 * Linked and special entries are rejected even when they do not end in .md,
 * because silently skipping an alias would change the observed population.
 *
 *
 * @evidence contracts/common.md#principled-implementation Only a regular file with exactly one native link is admitted after non-directory observation.
 * @evidence contracts/common.md#clear-and-simple-design Identity policy is independent of filename extension, so aliases cannot silently disappear from the observed layer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Linked and special entries refuse even when they are not Markdown files; no skipped alias weakens population identity.
 * @evidence contracts/common.md#meaningful-documentation The comment explains why non-Markdown aliases still refuse and leaves directory descent to the caller.
 * @evidence contracts/performance.md#efficient-algorithms Two scalar comparisons use O(1) work per observed entry.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller supplies its current lstat observation; no stale physical identity is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This predicate retains no observation after return and opens no descriptor.
 */
export function admitReferenceInventoryIdentity(entry: IAutoMovieReferenceIdentity): void {
  if (entry.kind !== "file" || entry.links !== 1n)
    fail("PATH_IDENTITY_CHANGED", "Layer contains a linked or special entry.");
}
