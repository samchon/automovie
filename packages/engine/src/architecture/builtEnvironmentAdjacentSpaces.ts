import {
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltEnvironment,
} from "@automovie/interface";

/**
 * Return spaces directly joined by a boundary or traversal connector.
 *
 * A run reaches every stop it declares, not only its two ends: a lift serving
 * four floors makes all four reachable from each other, because the floors it
 * stops at are the floors it joins. A one-way run reaches only stops further
 * along its own route, which is the same rule its two-ended form has always
 * followed, generalized to the stops between them.
 *
 * A shared boundary joins two spaces whether or not any opening passes through
 * it, so a closed partition still makes its rooms adjacent. Ids come back in
 * discovery order, boundaries first, without sorting. Throws for an undeclared
 * space id.
 */
export const builtEnvironmentAdjacentSpaces = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): string[] => {
  requireSpace(environment, spaceId);
  const adjacent = new Set<string>();
  for (const boundary of environment.boundaries)
    if (boundary.spaces.includes(spaceId))
      for (const candidate of boundary.spaces)
        if (candidate !== spaceId) adjacent.add(candidate);
  for (const connector of environment.connectors) {
    const stops = connectorStops(connector);
    const here = stops.indexOf(spaceId);
    if (here === -1) continue;
    stops.forEach((stop, index) => {
      if (index !== here && (connector.bidirectional || index > here))
        adjacent.add(stop);
    });
  }
  return [...adjacent];
};

const requireSpace = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): void => {
  if (!environment.spaces.some((space) => space.id === spaceId))
    throw new Error(
      `built environment "${environment.id}" has no logical space "${spaceId}"`,
    );
};

/** The spaces one run serves, in the order its own route reaches them. */
const connectorStops = (connector: IAutoMovieBuiltConnector): string[] => [
  connector.from,
  ...(connector.landings ?? []).map((landing) => landing.space),
  connector.to,
];
