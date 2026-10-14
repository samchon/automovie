import { IAutoMovieQuaternion } from "@automovie/interface";

/**
 * The articulation `hingedArmArticulation` chose for an arm reach, with its
 * range-of-motion cost.
 *
 * Every candidate the solver scores lands the hand on the reachable shell
 * toward the target, so the choice among them is legality first and then the
 * least clinical deviation from the anatomical neutral. `reachPose` lowers
 * `upper` and `lower` into clinical angles for the shoulder and elbow.
 *
 * @evidence contracts/common.md#principled-implementation The two deltas are a hinge rotation in closed form and a chain-root rotation from the swivel sweep, and `overshoot` is the caller scorer's value, which `reachPose` takes from `jointRomOvershoot`, the measure the pose gate applies, so the reported cost is the gate's verdict rather than a solver-private score.
 * @evidence contracts/common.md#clear-and-simple-design Mirrors the two-delta shape of `IAutoMovieTwoBoneArticulation` with the one extra fact a hinged solve has, its cost; the scorer's deviation term decides the choice but is dropped from the result because no caller reads it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A rig that cannot hold any legal pose still returns its least-overshoot candidate with a positive `overshoot` rather than a clamped pose presented as clean, and a non-finite angle scores `Infinity` so it cannot win.
 * @evidence contracts/common.md#meaningful-documentation States the producer, the selection rule, the consumer, each delta's joint and frame, the hinge-only property of `lower`, and the unit and meaning of `overshoot` including `0` and `Infinity`.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; the sweep's cost is answered on `hingedArmArticulation`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each arm reach chooses its own candidate for its own target, so a result is never shared between reaches.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two quaternions and a number, released with the caller's pose.
 * @author Samchon
 */
export interface IAutoMovieHingedArticulation {
  /** Bone-local articulation delta for the chain-root joint (the shoulder). */
  upper: IAutoMovieQuaternion;

  /**
   * Bone-local articulation delta for the mid joint (the elbow): a pure
   * rotation about that joint's own flexion axis, so its abduction and twist
   * decompose to exactly zero.
   */
  lower: IAutoMovieQuaternion;

  /**
   * Total ROM overshoot of the chosen candidate in degrees, `0` when the pose
   * satisfies both joints. Reported rather than hidden: a rig whose declared
   * ranges genuinely cannot hold any pose that reaches the target must still
   * say so, instead of the solver quietly returning its least-bad attempt as if
   * it were clean.
   *
   * `Infinity` when the scorer found a violation with no measurable overshoot,
   * which {@link jointRomOvershoot} reserves for a non-finite angle: unusable
   * rather than free, so a malformed candidate can never win the selection.
   */
  overshoot: number;
}
