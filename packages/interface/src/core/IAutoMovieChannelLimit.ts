import { IAutoMovieChannel } from "./IAutoMovieChannel";

/**
 * A constraint: a value-domain restriction on one channel, the generalized
 * range of motion. The engine clamps the channel to these bounds during
 * resolution and, crucially, _reports_ any violation (the same `[min, max]`
 * that clamps the pose also feeds the harness's `// ❌` correction), so
 * constraint resolution and validation are one computation.
 *
 * Bounds are per-component vectors matching the channel's width (a `scalar` rig
 * DOF has length-1 bounds; a `vec3` translation has length-3). A `null` side,
 * or a `null` component within a side, means that direction is unconstrained.
 *
 * `resolveFrame` clamps only a channel the frame sampled from a clip or a
 * channel-space driver wrote; a channel left at its rest value is not checked.
 * World-space drivers (aim, IK, parent, spring) run after the clamp, so their
 * results are never limited. A non-null bound past the channel width, a
 * non-finite bound or value, or `min` above `max` on one component throws.
 *
 * This is the general form. Humanoid anatomical ROM keeps its dedicated
 * semantic representation ({@link IAutoMovieJointConstraint},
 * flexion/abduction/twist) as the humanoid profile's specialization; this
 * channel limit covers scalar rig DOFs, group/node rotations, weights, and
 * generic object channels.
 *
 * @evidence contracts/common.md#principled-implementation Per-component interval clamp: `applyChannelLimit` copies the value, raises each component below its non-null `min`, lowers it above its non-null `max`, and records one violation per crossed bound in the same loop, so the clamped value and the report come from one comparison.
 * @evidence contracts/common.md#clear-and-simple-design One channel plus two nullable bound arrays expresses one-sided, partial and full limits without separate shapes, while the humanoid joint ROM stays its own semantic type instead of an option here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsampled channels are skipped rather than clamped against synthesized rest values, a direct consequence of `resolveFrame` iterating sampled keys; malformed bounds throw instead of being ignored, and no channel or profile is special-cased.
 * @evidence contracts/common.md#meaningful-documentation Gives the per-component width, the null-side and null-component meanings, which channels and which passes the clamp reaches, and every throwing case.
 * @author Samchon
 */
export interface IAutoMovieChannelLimit {
  /** The channel whose value is constrained. */
  channel: IAutoMovieChannel;

  /**
   * Lower bounds, one per channel component (e.g. `[xMin, yMin, zMin]`). `null`
   * = no lower bound on the channel; a `null` component = that axis is free.
   */
  min: (number | null)[] | null;

  /** Upper bounds, one per channel component. `null` semantics as for `min`. */
  max: (number | null)[] | null;
}
