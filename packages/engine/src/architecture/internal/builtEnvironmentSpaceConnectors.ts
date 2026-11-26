import {
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltEnvironment,
} from "@automovie/interface";

import { builtConnectorStops } from "./builtConnectorStops";
import { requireBuiltSpace } from "./requireBuiltSpace";

/**
 * Return every connector stopping at a logical space, endpoints and route
 * intact.
 *
 * Adjacency answers which spaces are reachable; this answers with what. The
 * authored 3D centre route is handed back as written rather than reduced to a
 * pair of ids, because a stair's rise and a bridge's span are the part a shot
 * stages and a later pathfinder would have to re-derive.
 *
 * Stops are matched exactly, not through containment: a connector declares the
 * spaces it actually lands in, its two ends and any landing between them, so
 * asking a building root returns the connectors declared on the root itself
 * rather than every connector inside it. That is the rule
 * {@link builtEnvironmentAdjacentSpaces} follows, and both read stops from one
 * list.
 *
 * The returned connectors are the record's own objects in record order. Throws
 * for an undeclared space id.
 */
export function builtEnvironmentSpaceConnectors(
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): IAutoMovieBuiltConnector[] {
  requireBuiltSpace(environment, spaceId);
  return environment.connectors.filter(
    (connector: IAutoMovieBuiltConnector): boolean =>
      builtConnectorStops(connector).includes(spaceId),
  );
}
