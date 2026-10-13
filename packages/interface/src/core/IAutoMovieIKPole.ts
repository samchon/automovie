/**
 * Pole target controlling which way a `twoBone` IK chain bends.
 *
 * The bend axis is the cross product of the root-to-goal direction with the
 * root-to-`node` direction (the upper bone when `node` is `null`), then rolled
 * about the root-to-goal direction by `angle`. When the two directions are
 * collinear an arbitrary fixed perpendicular is used. The iterative `ccd` and
 * `fabrik` solvers ignore the pole entirely.
 *
 * @evidence contracts/common.md#principled-implementation Standard pole-vector construction: the bend plane contains the root-to-goal line and the pole direction, and `anyPerp` supplies a deterministic perpendicular when the cross product vanishes.
 * @evidence contracts/common.md#clear-and-simple-design A node reference and an angle cover both pole-vector and pure-twist control in one record, with a `null` node standing in for a separate twist-only type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The iterative solvers drop a supplied pole without any warning, an ignored input stated here and reported as a finding rather than compensated; the collinear fallback is the only special case and follows from the vanishing cross product.
 * @evidence contracts/common.md#meaningful-documentation States which solver reads the pole, how `node` and `angle` build the bend axis, what `null` means, the degree unit, and the finiteness rule.
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
