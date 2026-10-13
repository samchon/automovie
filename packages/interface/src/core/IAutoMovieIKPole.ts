/**
 * Pole target controlling which way a `twoBone` IK chain bends.
 *
 * The bend axis is the cross product of the root-to-goal direction with the
 * root-to-`node` direction (the upper bone when `node` is `null`), then rolled
 * about the root-to-goal direction by `angle`. When the two directions are
 * collinear a fixed perpendicular is used: the cross with world `+Y`, or with
 * `+X` when that is degenerate. The iterative `ccd` and `fabrik` solvers ignore
 * the pole entirely.
 *
 * @evidence contracts/common.md#principled-implementation `applyTwoBoneIK` crosses the root-to-goal direction with the pole reference, falls back to `anyPerp` below a `1e-8` axis length, rotates the axis by `angle` degrees about the goal direction with `Quaternion.fromAxisAngle`, and bends the upper bone about that axis.
 * @evidence contracts/common.md#clear-and-simple-design A nullable node and one angle cover both a pole target and a pure roll of the current plane, so no separate roll-only driver field is needed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A collinear configuration takes a deterministic perpendicular rather than the previous frame's plane, and a non-finite angle throws rather than being treated as zero.
 * @evidence contracts/common.md#meaningful-documentation States how the bend axis is built, what a null node means, the angle unit and finiteness rule, the collinear fallback, and which solvers ignore the pole.
 * @author Samchon
 */
export interface IAutoMovieIKPole {
  /**
   * Node whose world position the bend plane faces, or `null` to keep the
   * limb's current bend plane and apply only `angle`.
   */
  node: string | null;

  /**
   * Roll of the bend axis about the root-to-goal direction, in degrees; must be
   * finite.
   */
  angle: number;
}
