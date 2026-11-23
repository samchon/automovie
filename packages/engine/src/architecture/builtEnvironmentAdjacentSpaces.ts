import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
} from "@automovie/interface";

import { builtConnectorStops } from "./builtConnectorStops";
import { requireBuiltSpace } from "./requireBuiltSpace";

/**
 * Return spaces directly joined by a boundary or traversal connector.
 *
 * A run reaches every stop it declares, not only its two ends: a lift serving
 * four floors makes all four reachable from each other, because the floors it
 * stops at are the floors it joins. A one-way run reaches only stops further
 * along its own route.
 *
 * A shared boundary joins two spaces whether or not any opening passes through
 * it, so a closed partition still makes its rooms adjacent. Stops and boundary
 * sides are matched exactly, not through containment, so asking a storey does
 * not return what its rooms touch. Ids come back once each in discovery order,
 * boundaries first and then connectors, without sorting. Throws for an
 * undeclared space id.
 */
export const builtEnvironmentAdjacentSpaces: (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
) => string[] = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): string[] => {
  const space: IAutoMovieBuiltSpace = requireBuiltSpace(environment, spaceId);
  const adjacent: Set<string> = new Set();
  for (const boundary of environment.boundaries)
    if (boundary.spaces.includes(space.id))
      for (const candidate of boundary.spaces)
        if (candidate !== space.id) adjacent.add(candidate);
  for (const connector of environment.connectors) {
    const stops: string[] = builtConnectorStops(connector);
    const here: number = stops.indexOf(space.id);
    if (here === -1) continue;
    stops.forEach((stop: string, index: number): void => {
      if (index !== here && (connector.bidirectional || index > here))
        adjacent.add(stop);
    });
  }
  return [...adjacent];
};
