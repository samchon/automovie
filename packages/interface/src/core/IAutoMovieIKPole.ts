/**
 * Pole target controlling which way a `twoBone` IK chain bends.
 *
 * The bend axis is the cross product of the root-to-goal direction with the
 * root-to-`node` direction (the upper bone when `node` is `null`), then rolled
 * about the root-to-goal direction by `angle`. When the two directions are
 * collinear an arbitrary fixed perpendicular is used. The iterative `ccd` and
 * `fabrik` solvers ignore the pole entirely.
 *
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
