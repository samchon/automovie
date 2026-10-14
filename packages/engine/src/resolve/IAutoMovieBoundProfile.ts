import { IAutoMovieChannelLimit, IAutoMovieDriver } from "@automovie/interface";

/**
 * A profile's declared limits/drivers, resolved onto concrete node ids.
 *
 *
 * @evidence contracts/common.md#principled-implementation Store declared channel limits and drivers after semantic references are resolved to concrete runtime node ids by bindProfile; binding validity depends on the admitted profile/reference map.
 * @evidence contracts/common.md#clear-and-simple-design Two arrays keep limit enforcement and driver evaluation explicit while profile authoring semantics stay outside the frame resolver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The binding transforms references without inventing unsupported channels or silently repairing a missing semantic key; this interface itself performs no admission.
 * @evidence contracts/common.md#meaningful-documentation Members document concrete-node limits/drivers and distinguish this resolved record from the authored semantic profile.
 * @evidence contracts/performance.md#efficient-algorithms Storage is O(L+D) references/records for limits and drivers, with binding cost owned by bindProfile rather than the type.
 * @evidence contracts/performance.md#reuse-equivalent-work A frame resolver can reuse a bound profile while its authored profile and concrete node mapping remain unchanged; no identity-only invalidation guarantee is encoded here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The resolver/caller owns bound arrays for its shot lifetime; no node graph, handle or driver task is retained by the declaration.
 * @author Samchon
 */
export interface IAutoMovieBoundProfile {
  /** The profile's limits with every node reference made concrete. */
  limits: IAutoMovieChannelLimit[];

  /** The profile's drivers with every node reference made concrete. */
  drivers: IAutoMovieDriver[];
}
