import { IAutoMovieChannelLimit, IAutoMovieDriver } from "@automovie/interface";

/**
 * A profile's declared limits/drivers, resolved onto concrete node ids.
 *
 *
 * @evidence contracts/development/design.md#principled-representation Store declared channel limits and drivers after semantic references are resolved to concrete runtime node ids by bindProfile; binding validity depends on the admitted profile/reference map.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two arrays keep limit enforcement and driver evaluation explicit while profile authoring semantics stay outside the frame resolver.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The binding transforms references without inventing unsupported channels or silently repairing a missing semantic key; this interface itself performs no admission.
 * @evidence contracts/development/common.md#meaningful-documentation Members document concrete-node limits/drivers and distinguish this resolved record from the authored semantic profile.
 */
export interface IAutoMovieBoundProfile {
  /** The profile's limits with every node reference made concrete. */
  limits: IAutoMovieChannelLimit[];

  /** The profile's drivers with every node reference made concrete. */
  drivers: IAutoMovieDriver[];
}
