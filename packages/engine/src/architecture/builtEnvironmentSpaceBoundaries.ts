import {
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltEnvironment,
} from "@automovie/interface";

import { requireBuiltSpace } from "./requireBuiltSpace";

/**
 * Return every boundary that encloses or separates a logical space.
 *
 * {@link builtEnvironmentAdjacentSpaces} keeps only the far-side space ids,
 * which answers which rooms are next to this one and discards what stands
 * between them: the boundary's identity, its `kind`, and the elements realizing
 * it. This answers with what, as {@link builtEnvironmentSpaceConnectors} does
 * for traversal. A slab between two storeys belongs to neither room alone, so a
 * room whose ceiling is owned by its storey reads like a room with no ceiling
 * unless its enclosure can be asked directly.
 *
 * Matched exactly rather than through containment, the rule adjacency and
 * connector lookup follow: asking a storey returns the storey's own enclosure
 * and not every partition standing inside its rooms. Boundaries are handed back
 * whole, because `kind` distinguishes a ceiling from a wall and `elements` says
 * whether anything visible realizes it; a boundary with an empty `elements` is a
 * separation the design declares and nothing builds.
 *
 * The returned boundaries are the record's own objects in record order, not
 * copies. Throws for an undeclared space id.
 *
 * @evidence contracts/common.md#principled-implementation A filter over the record's boundaries on exact membership of the space id in each boundary's `spaces`, which preserves record order and object identity.
 * @evidence contracts/common.md#clear-and-simple-design Returns the record objects whole instead of a projection, so `kind` and `elements` reach the caller without a second lookup, and refuses ids through the shared `requireBuiltSpace`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no space or boundary kind; a storey-owned slab is not reassigned to the rooms below it, and a boundary nothing builds is returned as declared.
 * @evidence contracts/common.md#meaningful-documentation States what the answer adds over adjacency, exact matching rather than containment, why boundaries come back whole, what an empty `elements` means, record order, that the objects are not copies, and the throw.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the summed boundary side counts plus the space count for the id check; no index exists to avoid the scan.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Returns references into the caller's boundary list rather than a cached copy, so a later edit to the record is seen by the next call; no work is shared between calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates only the returned array, which references the record's own boundaries and is owned by the caller.
 * @author Samchon
 */
export const builtEnvironmentSpaceBoundaries = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): IAutoMovieBuiltBoundary[] => {
  requireBuiltSpace(environment, spaceId);
  return environment.boundaries.filter(
    (boundary: IAutoMovieBuiltBoundary): boolean =>
      boundary.spaces.includes(spaceId),
  );
};
