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
 * @evidence contracts/common.md#principled-implementation Choosing among exact inverse charts by the caller's own ROM is a lossless choice, because every candidate reconstructs the same quaternion; the score is the gate's `jointRomOvershoot`, so the chosen reading is the one the gate judges most leniently without altering the rotation.
 * @evidence contracts/common.md#clear-and-simple-design The bone and its resolved constraint travel together because the overshoot measure needs both, and the constraint is already resolved by the caller so the inverse never consults defaults or rig tables.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The constraint only ranks readings; no angle is clamped or wrapped beyond a full-turn alias inside the declared interval, so a refused pose remains refused.
 * @evidence contracts/common.md#meaningful-documentation States the consumer, the selection rule with its tie-break, the no-clamp guarantee, what `null` means, and who supplies it.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; the two-candidate scoring cost is answered on `decomposeJointRotation`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built by the caller per joint; nothing is computed here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A bone name and a reference to the caller's constraint.
 * @author Samchon
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
