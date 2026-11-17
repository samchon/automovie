import type { IAutoMovieVector3 } from "../../geometry/IAutoMovieVector3";

/**
 * Data and callback contracts shared by the RigidTransformVelocity operations.
 *
 * @evidence contracts/development/design.md#principled-representation Linear and angular world vectors report translation and principal rotation secants in metres/second and radians/second.
 * @evidence contracts/development/design.md#minimal-and-owned-surface rigidTransformVelocity returns the two rigid-frame rates used by motion observations; the existing vector contract owns their components.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The observation is neither an instantaneous derivative nor evidence of intervening turns; invalid intervals, rotations and exact half-turn ambiguity refuse.
 * @evidence contracts/development/common.md#meaningful-documentation Documents units, world frame, shortest-arc branch, input ownership and refusal.
 */
export namespace IAutoMovieRigidTransformVelocity {
  /**
   * Finite WORLD rigid-frame velocities over a positive interval: translation secant in metres/second and shortest-arc rotation secant in radians/second. Both frames must describe the same rigid identity in WORLD coordinates. The caller owns deterministic actual sampling and selects one continuous branch; these two frames cannot reveal intervening turns, constraints or impacts. This is not an instantaneous derivative or a momentum estimate.
   *
   * Rotation admission uses the engine's existing 1e-6 unit-norm rule. Admitted rotations are normalized into private copies for the logarithm. A computed relative quaternion with exactly zero scalar component refuses because its half-turn has two equally short axes. Nonpositive/nonfinite time, invalid components or unrepresentable arithmetic throw RangeError without changing either input. Scale is outside this rigid frame observation; a deforming point needs its own actual point samples.
   *
   * @evidence contracts/development/design.md#principled-representation Linear and angular world vectors report translation and principal rotation secants in metres/second and radians/second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface rigidTransformVelocity returns the two rigid-frame rates used by motion observations; the existing vector contract owns their components.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The observation is neither an instantaneous derivative nor evidence of intervening turns; invalid intervals, rotations and exact half-turn ambiguity refuse.
   * @evidence contracts/development/common.md#meaningful-documentation Documents units, world frame, shortest-arc branch, input ownership and refusal.
   */
  export type IResult = {
    /** WORLD translation secant, metres per second. */
    linear: IAutoMovieVector3;

    /** Principal WORLD rotation increment divided by time, radians per second. */
    angular: IAutoMovieVector3;
  };
}
