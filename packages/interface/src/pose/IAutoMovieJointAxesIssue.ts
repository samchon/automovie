/**
 * One defect in a declared joint-axis basis, located at the field that holds
 * it.
 *
 * `validateJointAxesBasis` returns these in order: per axis, each non-finite
 * component or else a zero length; then each non-orthogonal pair; then an
 * unknown twist placement. Motion retargeting forwards each as a range violation, and
 * `normalizeJointAxes` throws the first as `<path> <expected>`.
 *
 * @evidence contracts/development/design.md#principled-representation A located violation record in the same path, expectation and value form the engine's violation collector uses, so a retargeting caller forwards it field for field without rewording.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned as plain data so the throwing normalizer and the collecting retargeter share one validator and each decides whether to stop or report.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `value` carries the offending input itself, never a corrected one, so a report shows what the author actually declared.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, the defect kinds and their order, both consumers, and what each field holds including the pair shape for an orthogonality issue.
 */
export interface IAutoMovieJointAxesIssue {
  /**
   * The caller's base path followed by the field, such as
   * `$input.targetJointAxes.leftLowerArm.flexion.x` for a component or
   * `...twistPlacement` for the placement.
   */
  path: string;

  /** The requirement the field fails, phrased as a correction. */
  expected: string;

  /**
   * The offending input: a number for a component, the axis vector for a zero
   * length, an object holding both axes for an orthogonality failure, or the
   * unknown placement value.
   */
  value: unknown;
}
