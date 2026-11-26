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
 * whether anything visible realizes it; a boundary with an empty `elements` is
 * a separation the design declares and nothing builds.
 *
 * The returned boundaries are the record's own objects in record order, not
 * copies. Throws for an undeclared space id.
 */
export function builtEnvironmentSpaceBoundaries(
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): IAutoMovieBuiltBoundary[] {
  requireBuiltSpace(environment, spaceId);
  return environment.boundaries.filter(
    (boundary: IAutoMovieBuiltBoundary): boolean =>
      boundary.spaces.includes(spaceId),
  );
}
