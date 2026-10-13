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
 *
 * @evidence contracts/common.md#principled-implementation Adds the co-listed spaces of every boundary naming the space, then for every run the other stops in route order (`from`, landings, `to`), admitting earlier stops only when the run is bidirectional; a `Set` removes repeats.
 * @evidence contracts/common.md#clear-and-simple-design Defect: `requireSpace` and `connectorStops` are private copies also carried by `builtEnvironmentSpaceConnectors` and the other space queries instead of one shared helper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No space or connector kind is special-cased; one-way travel is the contract's own `bidirectional` flag, and an undeclared space id throws instead of answering empty.
 * @evidence contracts/common.md#meaningful-documentation States that every declared stop is reachable, the one-way rule, that a boundary joins spaces regardless of openings, the unsorted discovery order, and the refusal.
 * @evidence contracts/performance.md#cost-and-resources One existence scan over spaces, one pass over boundaries and their short space lists, and one over runs and their stops, so linear in record size; no index is cached, and the drawing schedule's per-space calls repeat both scans.
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
