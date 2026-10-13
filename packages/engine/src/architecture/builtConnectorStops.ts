import {
  IAutoMovieBuiltConnector,
  IAutoMovieConnectorLanding,
} from "@automovie/interface";

/**
 * The spaces one connector serves, in the order its own route reaches them.
 *
 * A run stops at its `from` space, at every landing in declared order, and at
 * its `to` space. Adjacency, space-connector lookup and the building census all
 * read a run's stops through this one list, so a landing counts as a stop in
 * every answer or in none. Landings are not re-sorted by `at`; validation
 * requires them in route order.
 *
 * @evidence contracts/common.md#principled-implementation A concatenation of the authored endpoints and landings, which is the connector's own statement of where it stops; it relies on landings being in route order, which validation enforces, and does not re-sort them.
 * @evidence contracts/common.md#clear-and-simple-design One list shared by adjacency, connector lookup and the census instead of three private copies, so the meaning of a stop has one owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Treats every connector kind alike and adds no inferred stop; a run that declares no landing has exactly its two ends.
 * @evidence contracts/common.md#meaningful-documentation States the stop order, that every landing is a stop, that landings keep their declared order, and which queries share the list.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the landing count, building one array of stop ids per call.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Pure projection of one record that coordinates no work; callers that need it repeatedly per connector call it once per connector.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned array, bounded by the landing count plus two.
 */
export const builtConnectorStops = (
  connector: IAutoMovieBuiltConnector,
): string[] => [
  connector.from,
  ...(connector.landings ?? []).map(
    (landing: IAutoMovieConnectorLanding): string => landing.space,
  ),
  connector.to,
];
