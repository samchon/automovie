import type { IAutoMovieMaterializedLibraryOwner } from "@automovie/interface";
import { compareCodeUnits, encodeAutoMoviePathSegment } from "./contentIdentity";

/**
 * Environment/model/context ids use the shared segment encoder and fixed namespaces, then code-unit sorting.
 *
 * @evidence contracts/common.md#principled-implementation Environment/model/context ids use the shared segment encoder and fixed namespaces, then code-unit sorting.
 * @evidence contracts/common.md#clear-and-simple-design Inspection derives the same persisted paths as library materialization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The contexts assertion relies on parseOwner always supplying the list; long-id hashing is not reversible path text.
 * @evidence contracts/common.md#meaningful-documentation States namespaces, ordering and the admitted-owner premise.
 * @evidence contracts/performance.md#efficient-algorithms Encodes A ids/L text and sorts A paths with proportional output references/text.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the persisted-id encoder without a per-owner path cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns fresh paths and the input owner is not mutated or retained.
 */
export const libraryStateOwnerArtifactPaths: (owner: IAutoMovieMaterializedLibraryOwner) => string[] = (owner: IAutoMovieMaterializedLibraryOwner): string[] => [
    ...owner.environments.map((id: string) : string => `library/environments/${encodeAutoMoviePathSegment(id)}.json`),
    ...owner.models.map((id: string) : string => `models/${encodeAutoMoviePathSegment(id)}.json`),
    // `parseOwner` materializes every context list, so the optional interface
    // field is always present here.
    ...owner.contexts!.map((id: string) : string => `library/contexts/${encodeAutoMoviePathSegment(id)}.json`),
].sort(compareCodeUnits);
