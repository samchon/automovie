import { IAutoMovieBuiltConnector, IAutoMovieBuiltEnvironment } from "@automovie/interface";

/**
 * Return every connector landing on a logical space, endpoints and route
 * intact.
 *
 * Adjacency answers which spaces are reachable; this answers with what. The
 * authored 3D centre route is handed back as written rather than reduced to a
 * pair of ids, because a stair's rise and a bridge's span are the part a shot
 * stages and a later pathfinder would have to re-derive.
 *
 * Stops are matched exactly, not through containment: a connector declares the
 * spaces it actually lands in — its two ends and any landing between them — so
 * asking a building root returns the connectors declared on the root itself
 * rather than every connector inside it. That is the same rule
 * {@link builtEnvironmentAdjacentSpaces} follows.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `builtEnvironmentSpaceConnectors` returns every connector landing on a logical space, endpoints and route intact. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `builtEnvironmentSpaceConnectors` collects the connectors whose landings belong to a logical space while preserving their endpoints and routes.
 */
export const builtEnvironmentSpaceConnectors = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): IAutoMovieBuiltConnector[] => {
  requireSpace(environment, spaceId);
  return environment.connectors.filter((connector) =>
    connectorStops(connector).includes(spaceId),
  );
};
