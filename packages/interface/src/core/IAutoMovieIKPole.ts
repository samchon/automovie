/**
 * Pole target controlling which way a `twoBone` IK chain bends.
 *
 * The bend axis crosses the effective goal direction with the root-to-node vector, or current upper segment when node is null, then rolls by angle. A root-to-goal length below 1e-8 uses the upper segment's direction. A cross shorter than 1e-8 uses a deterministic perpendicular from world +Y or +X. CCD and FABRIK ignore the pole.
 *
 * @evidence contracts/common.md#principled-implementation applyTwoBoneIK derives the effective goal direction, crosses the pole reference, uses anyPerp when the cross length is below 1e-8 and rolls by the finite angle in degrees before normalizing the bend axis. anyPerp keeps its +Y cross only above 1e-6, otherwise using the +X cross.
 * @evidence contracts/common.md#clear-and-simple-design A nullable node and one angle cover both a pole target and a pure roll of the current plane, so no separate roll-only driver field is needed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A collinear configuration takes a deterministic perpendicular rather than the previous frame's plane, and a non-finite angle throws rather than being treated as zero.
 * @evidence contracts/common.md#meaningful-documentation States how the bend axis is built, what a null node means, the angle unit and finiteness rule, the collinear fallback, and which solvers ignore the pole.
 */
export interface IAutoMovieIKPole {
  /**
   * Node supplying the bend reference, or null to use the current upper segment; a collinear reference uses the documented deterministic perpendicular.
   */
  node: string | null;

  /**
   * Finite degree roll of the bend axis about the effective goal direction.
   */
  angle: number;
}
