import { IAutoMovieChannel } from "./IAutoMovieChannel";

/**
 * A per-component restriction on one sampled channel. applyChannelLimit validates the values and bounds, clamps crossed components and returns their original values in the same outcome.
 *
 * A null side or null component leaves that direction unconstrained; a shorter bound vector also leaves its omitted tail unconstrained. A resident array hole is not an omitted tail: its undefined entry is refused. Bounds are checked against the supplied value array's width, not independently against the channel's declared width.
 *
 * resolveFrame clamps only sampled or channel-driven values; unsampled rest values are not checked. World-space drivers run after clamping. Non-null bounds past the supplied value width, nonfinite values/bounds and reversed intervals throw. Quaternion components are boxed independently without subsequent normalization, so this is not an angular or anatomical limit.
 *
 * Humanoid clinical ROM keeps its separate IAutoMovieJointConstraint representation. This generic box limit addresses scalar, vector, quaternion-component and weight values.
 *
 * @evidence contracts/common.md#principled-implementation `applyChannelLimit` validates finiteness, width and ordering, then clamps each component independently to its own bounds and records one violation per crossed bound with the component, side, limit and actual value, a per-axis box clamp.
 * @evidence contracts/common.md#clear-and-simple-design One channel reference and two nullable bound vectors express every per-component box limit, and profile-bound limits apply before direct ones in `resolveFrame` so the caller's limit clamps last.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed bounds throw instead of being ignored, and an out-of-range value is clamped and reported rather than silently clamped; the remaining gap is that a rotation quaternion is boxed per component, which is not an angular limit, so the humanoid joint constraint stays separate.
 * @evidence contracts/common.md#meaningful-documentation States combined clamping/reporting, supplied-value width, null versus omitted-tail versus resident-hole semantics, phase ordering and unnormalized quaternion component bounds.
 * @author Samchon
 */
export interface IAutoMovieChannelLimit {
  /** The channel whose value is constrained. */
  channel: IAutoMovieChannel;

  /**
   * Lower component bounds, such as [xMin, yMin, zMin]. A null side, null component or omitted tail leaves that direction free; resident holes are invalid.
   */
  min: (number | null)[] | null;

  /** Upper bounds, one per channel component, with the same `null` meaning. */
  max: (number | null)[] | null;
}
