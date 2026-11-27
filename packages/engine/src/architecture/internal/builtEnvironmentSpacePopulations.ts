import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltPopulation,
} from "@automovie/interface";

import { builtSpaceSubtree } from "./builtSpaceSubtree";
import { requireBuiltSpace } from "./requireBuiltSpace";

/*
 * Report the compact populations standing in a logical space and its
 * descendants.
 *
 * builtEnvironmentSpaceNodes returns owner ids; this returns the
 * population records so callers can regenerate member transforms from the
 * renderer's declared placement law. Selection uses the authored space field
 * and its ancestors, independent of member positions. That semantic ownership
 * can include members intentionally crossing a geometric boundary and does not
 * imply every member lies in the space's stated volume.
 *
 * The records are the environment's own objects in record order. Throws an
 * `Error` for an undeclared space id.
 * Parameter environment: Building record to read.
 * Parameter spaceId: Logical space whose populations are reported.
 * Returns: The population records the space or a descendant declares.
 */
export function builtEnvironmentSpacePopulations(
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): IAutoMovieBuiltPopulation[] {
  requireBuiltSpace(environment, spaceId);
  const included: Set<string> = builtSpaceSubtree(environment.spaces, spaceId);
  return (environment.populations ?? []).filter(
    (population: IAutoMovieBuiltPopulation): boolean =>
      included.has(population.space),
  );
}
