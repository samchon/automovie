import type { IAutoMovieChannel } from "./IAutoMovieChannel";

/**
 * A per-component restriction on one sampled channel. applyChannelLimit
 * validates the values and bounds, clamps crossed components and returns their
 * original values in the same outcome.
 *
 * A null side or null component leaves that direction unconstrained; a shorter
 * bound vector also leaves its omitted tail unconstrained. A resident array
 * hole is not an omitted tail: its undefined entry is refused. Bounds are
 * checked against the supplied value array's width, not independently against
 * the channel's declared width.
 *
 * ResolveFrame clamps only sampled or channel-driven values; unsampled rest
 * values are not checked. World-space drivers run after clamping. Non-null
 * bounds past the supplied value width, nonfinite values/bounds and reversed
 * intervals throw. Quaternion components are boxed independently without
 * subsequent normalization, so this is not an angular or anatomical limit.
 *
 * Humanoid clinical ROM keeps its separate IAutoMovieJointConstraint
 * representation. This generic box limit addresses scalar, vector,
 * quaternion-component and weight values.
 */
export interface IAutoMovieChannelLimit {
  /** The channel whose value is constrained. */
  channel: IAutoMovieChannel;

  /**
   * Lower component bounds, such as [xMin, yMin, zMin]. A null side, null
   * component or omitted tail leaves that direction free; resident holes are
   * invalid.
   */
  min: (number | null)[] | null;

  /** Upper bounds, one per channel component, with the same `null` meaning. */
  max: (number | null)[] | null;
}
