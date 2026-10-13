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
 *
 * @evidence contracts/common.md#principled-implementation Collects the other sides of every boundary listing the space and the reachable stops of every connector serving it into an insertion-ordered `Set`, so each neighbour appears once in discovery order; reachability is any other stop for a bidirectional run and only later stops for a one-way run.
 * @evidence contracts/common.md#clear-and-simple-design Reads stops through the shared `builtConnectorStops` and refuses ids through `requireBuiltSpace`, so this query owns only the adjacency rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no space or connector kind; a closed partition counts as adjacency by the stated rule rather than by inspecting openings, and a run that lists the space twice, which validation refuses, is not repaired here.
 * @evidence contracts/common.md#meaningful-documentation States the multi-stop and one-way rules, that a closed boundary still joins, exact matching rather than containment, the uniqueness and discovery order of the ids, and the throw.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the summed boundary side counts plus the summed connector stop counts, with constant-time set inserts; every boundary and connector is scanned because neither is indexed by space.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Answers one space per call over the caller's mutable record; a caller asking many spaces owns any index it builds.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Keeps nothing after returning; the caller owns the returned ids, bounded by the space count.
 */
export const builtEnvironmentAdjacentSpaces = (
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
