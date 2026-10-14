import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltPopulation,
} from "@automovie/interface";

import { builtSpaceSubtree } from "./builtSpaceSubtree";
import { requireBuiltSpace } from "./requireBuiltSpace";

/**
 * Report the compact populations standing in a logical space and its descendants.
 *
 * {@link builtEnvironmentSpaceNodes} returns owner ids; this returns the population records so callers can regenerate member transforms from the renderer's declared placement law. Selection uses the authored space field and its ancestors, independent of member positions. That semantic ownership can include members intentionally crossing a geometric boundary and does not imply every member lies in the space's stated volume.
 *
 * The records are the environment's own objects in record order. Throws an `Error` for an undeclared space id.
 *
 * @param environment Building record to read.
 * @param spaceId Logical space whose populations are reported.
 * @returns The population records the space or a descendant declares.
 *
 * @evidence contracts/common.md#principled-implementation Filters each population's declared `space` against the subtree from `builtSpaceSubtree`. This is semantic membership, independent of geometric containment: a population may intentionally cross its room boundary, while the containment query itself admits boundary points.
 * @evidence contracts/common.md#clear-and-simple-design The id lookup and the subtree fold are the shared `requireBuiltSpace` and `builtSpaceSubtree`, so this query owns only the population filter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no space or population and tests no geometry; rejecting a derived membership test is a stated contract choice rather than an exception for one record.
 * @evidence contracts/common.md#meaningful-documentation States why the records are returned, that selection is by declared membership and why, that the objects are the record's own in record order, and the thrown refusal.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the space and population counts: one subtree walk and one filtered pass with a set lookup per population.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call reads the population list of the record it is handed; a filtered list from an earlier call could not prove the record unchanged, so none is kept.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds the subtree set only for the call; the returned array is new but shares the record's own population objects.
 * @author Samchon
 */
export const builtEnvironmentSpacePopulations: (environment: IAutoMovieBuiltEnvironment, spaceId: string) => IAutoMovieBuiltPopulation[] = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): IAutoMovieBuiltPopulation[] => {
  requireBuiltSpace(environment, spaceId);
  const included: Set<string> = builtSpaceSubtree(environment.spaces, spaceId);
  return (environment.populations ?? []).filter(
    (population: IAutoMovieBuiltPopulation): boolean =>
      included.has(population.space),
  );
};
