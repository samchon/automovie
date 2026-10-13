import { IAutoMovieChannel } from "./IAutoMovieChannel";

/**
 * A limit: a value-domain restriction on one channel, the generalized range of
 * motion. The engine clamps the channel to these bounds during resolution and
 * reports every bound it crossed, so the same `[min, max]` that clamps the pose
 * also feeds the authoring harness's correction, and limit resolution and
 * validation are one computation.
 *
 * Bounds are per-component vectors matching the channel's width (a `scalar`
 * rig degree of freedom has length-1 bounds; a `vec3` translation has
 * length-3). A `null` side, or a `null` or missing component within a side,
 * means that direction is unconstrained.
 *
 * `resolveFrame` clamps only a channel the frame sampled from a clip or a
 * channel-space driver wrote; a channel left at its rest value is not checked.
 * World-space drivers (aim, IK, parent, spring) run after the clamp, so their
 * results are never limited. A non-null bound past the channel width, a
 * non-finite bound or value, or `min` above `max` on one component throws.
 *
 * This is the general form. Humanoid anatomical range of motion keeps its
 * dedicated semantic representation ({@link IAutoMovieJointConstraint}, with
 * flexion, abduction and twist) as the humanoid profile's specialization; this
 * channel limit covers scalar rig degrees of freedom, group and node rotations,
 * weights, and generic object channels.
 *
 * @evidence contracts/common.md#principled-implementation `applyChannelLimit` validates finiteness, width and ordering, then clamps each component independently to its own bounds and records one violation per crossed bound with the component, side, limit and actual value, a per-axis box clamp.
 * @evidence contracts/common.md#clear-and-simple-design One channel reference and two nullable bound vectors express every per-component box limit, and profile-bound limits apply before direct ones in `resolveFrame` so the caller's limit clamps last.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed bounds throw instead of being ignored, and an out-of-range value is clamped and reported rather than silently clamped; the remaining gap is that a rotation quaternion is boxed per component, which is not an angular limit, so the humanoid joint constraint stays separate.
 * @evidence contracts/common.md#meaningful-documentation States that clamping and reporting are one computation, the per-component bound layout and the meaning of null or missing entries, which channels are checked and which drivers escape the clamp, and every throw.
 * @author Samchon
 */
export interface IAutoMovieChannelLimit {
  /** The channel whose value is constrained. */
  channel: IAutoMovieChannel;

  /**
   * Lower bounds, one per channel component (such as `[xMin, yMin, zMin]`).
   * `null` means no lower bound on the channel; a `null` component leaves that
   * axis free.
   */
  min: (number | null)[] | null;

  /** Upper bounds, one per channel component, with the same `null` meaning. */
  max: (number | null)[] | null;
}
