import {
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltEnvironment,
} from "@automovie/interface";

import { builtConnectorStops } from "./builtConnectorStops";
import { requireBuiltSpace } from "./requireBuiltSpace";

/**
 * Return every connector stopping at a logical space, endpoints and route intact.
 *
 * Adjacency answers which spaces are reachable; this answers with what. The authored 3D centre route is handed back as written rather than reduced to a pair of ids, because a stair's rise and a bridge's span are the part a shot stages and a later pathfinder would have to re-derive.
 *
 * Stops are matched exactly, not through containment: a connector declares the spaces it actually lands in, its two ends and any landing between them, so asking a building root returns the connectors declared on the root itself rather than every connector inside it. That is the rule {@link builtEnvironmentAdjacentSpaces} follows, and both read stops from one list.
 *
 * The returned connectors are the record's own objects in record order. Throws for an undeclared space id.
 *
 * @evidence contracts/common.md#principled-implementation Filters the record's connectors on exact membership of the space id in each connector's stop list, preserving record order and object identity.
 * @evidence contracts/common.md#clear-and-simple-design Reads stops through the shared `builtConnectorStops` and refuses ids through `requireBuiltSpace`, so this query owns only the filter and agrees with adjacency on what a stop is.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no connector kind or space; containment is deliberately not applied, so a root is not credited with its rooms' connectors.
 * @evidence contracts/common.md#meaningful-documentation States why routes come back intact, exact stop matching and what it excludes, the shared stop rule, record order, that the objects are the record's own, and the throw.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the summed connector stop counts plus the space count for the id check.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Rebuilds each connector's stop list on every call instead of indexing stops by space, because the index would outlive a record the caller may edit; no work is shared between calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates one stop list per connector during the scan and the returned array of record references, which the caller owns.
 */
export const builtEnvironmentSpaceConnectors: (environment: IAutoMovieBuiltEnvironment, spaceId: string) => IAutoMovieBuiltConnector[] = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): IAutoMovieBuiltConnector[] => {
  requireBuiltSpace(environment, spaceId);
  return environment.connectors.filter(
    (connector: IAutoMovieBuiltConnector): boolean =>
      builtConnectorStops(connector).includes(spaceId),
  );
};
