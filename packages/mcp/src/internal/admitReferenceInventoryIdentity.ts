import type { IAutoMovieReferenceIdentity } from "../structures/IAutoMovieReferenceIdentity";
import { fail } from "./referenceError";

/**
 * Admit a non-directory inventory observation before its name can be published.
 * Linked and special entries are rejected even when they do not end in .md,
 * because silently skipping an alias would change the observed population.
 */
export function admitReferenceInventoryIdentity(entry: IAutoMovieReferenceIdentity): void {
  if (entry.kind !== "file" || entry.links !== 1n)
    fail("PATH_IDENTITY_CHANGED", "Layer contains a linked or special entry.");
}
