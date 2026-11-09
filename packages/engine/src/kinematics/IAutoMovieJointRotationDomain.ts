import {
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
} from "@automovie/interface";

/**
 * Effective clinical domain `decomposeJointRotation` uses to choose between
 * the two equivalent angle charts of one quaternion.
 *
 * Every rotation has a second Euler-style reading, and full-turn aliases of
 * each. With a constraint, the inverse scores both readings with
 * `jointRomOvershoot` against it and keeps the one with less overshoot, the
 * principal reading on a tie. Chart selection never clamps a coordinate or
 * changes this domain, so a rotation no chart admits still reports its
 * overshoot downstream. The chain plant passes one domain per joint.
 *
 * @evidence contracts/development/design.md#principled-representation Choosing among exact inverse charts by the caller's own ROM is a lossless choice, because every candidate reconstructs the same quaternion; the score is the gate's `jointRomOvershoot`, so the chosen reading is the one the gate judges most leniently without altering the rotation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The bone and its resolved constraint travel together because the overshoot measure needs both, and the constraint is already resolved by the caller so the inverse never consults defaults or rig tables.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The constraint only ranks readings; no angle is clamped or wrapped beyond a full-turn alias inside the declared interval, so a refused pose remains refused.
 * @evidence contracts/development/common.md#meaningful-documentation States the consumer, the selection rule with its tie-break, the no-clamp guarantee, what `null` means, and who supplies it.
 */
export interface IAutoMovieJointRotationDomain {
  /** Rig bone whose coordinates the inverse reports, used to name the scored joint. */
  bone: AutoMovieHumanoidBone;

  /**
   * The caller's effective range of motion for that bone; `null` keeps the
   * principal reading, because no range prefers one chart over another.
   */
  constraint: IAutoMovieJointConstraint | null;
}
