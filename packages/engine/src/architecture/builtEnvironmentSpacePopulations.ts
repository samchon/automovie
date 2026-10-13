import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltPopulation,
} from "@automovie/interface";

import { builtSpaceSubtree } from "./builtSpaceSubtree";
import { requireBuiltSpace } from "./requireBuiltSpace";

/**
 * Report the compact populations standing in a logical space and its
 * descendants.
 *
 * {@link builtEnvironmentSpaceNodes} names them; this hands back the records, so
 * a caller that needs a member's own transform regenerates it from the same set
 * the renderer draws instead of re-deriving a placement law from the geometry.
 * Selection is by declared membership, exactly as an element's is: a population
 * states the one space it occupies and every ancestor of that space folds it in,
 * so nothing here tests a member's position against a cell. That is deliberate.
 * A floor flag rests on the floor plane and an ashlar block sits inside the
 * wall, both of them on or across the boundary a derived test would have to
 * judge them against, so deriving membership would answer "the room is empty" in
 * exactly the cases the room is most full.
 *
 * The records are the environment's own objects in record order. Throws an
 * `Error` for an undeclared space id.
 *
 * @param environment Building record to read.
 * @param spaceId Logical space whose populations are reported.
 * @returns The population records the space or a descendant declares.
 *
 * @evidence contracts/common.md#principled-implementation A filter over each population's declared `space` against the subtree `builtSpaceSubtree` folds; membership is authored rather than derived from positions because a member resting on or inside a boundary would be judged outside by any geometric test.
 * @evidence contracts/common.md#clear-and-simple-design The id lookup and the subtree fold are the shared `requireBuiltSpace` and `builtSpaceSubtree`, so this query owns only the population filter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no space or population and tests no geometry; rejecting a derived membership test is a stated contract choice rather than an exception for one record.
 * @evidence contracts/common.md#meaningful-documentation States why the records are returned, that selection is by declared membership and why, that the objects are the record's own in record order, and the thrown refusal.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the space and population counts: one subtree walk and one filtered pass with a set lookup per population.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call reads the population list of the record it is handed; a filtered list from an earlier call could not prove the record unchanged, so none is kept.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds the subtree set only for the call; the returned array is new but shares the record's own population objects.
 * @author Samchon
 */
export const builtEnvironmentSpacePopulations = (
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
