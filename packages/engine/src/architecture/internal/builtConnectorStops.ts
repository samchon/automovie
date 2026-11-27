import {
  IAutoMovieBuiltConnector,
  IAutoMovieConnectorLanding,
} from "@automovie/interface";

/*
 * The spaces one connector serves, in the order its own route reaches them.
 *
 * A run stops at its `from` space, at every landing in declared order, and at
 * its `to` space. Adjacency, space-connector lookup and the building census all
 * read a run's stops through this one list, so a landing counts as a stop in
 * every answer or in none. Landings are not re-sorted by `at`; validation
 * requires them in route order.
 */
export function builtConnectorStops(
  connector: IAutoMovieBuiltConnector,
): string[] {
  return [
    connector.from,
    ...(connector.landings ?? []).map(
      (landing: IAutoMovieConnectorLanding): string => landing.space,
    ),
    connector.to,
  ];
}
