/**
 * One defect in a declared joint-axis basis, located at the field that holds
 * it.
 *
 * `validateJointAxesBasis` returns these in order: per axis, each non-finite
 * component or else a zero length; then each non-orthogonal pair; then an
 * unknown twist placement or rotation order, or a proximal placement that
 * conflicts with the explicit order. Motion retargeting forwards each as a
 * range violation, and `normalizeJointAxes` throws the first as `<path>
 * <expected>`.
 */
export interface IAutoMovieJointAxesIssue {
  /**
   * The caller's base path followed by the field, such as
   * `$input.targetJointAxes.leftLowerArm.flexion.x` for a component or
   * `...twistPlacement` or `...rotationOrder` for the rotation convention.
   */
  path: string;

  /** The requirement the field fails, phrased as a correction. */
  expected: string;

  /**
   * The offending input: a number for a component, the axis vector for a zero
   * length, an object holding both axes for an orthogonality failure, or the
   * invalid placement or rotation order value.
   */
  value: unknown;
}
