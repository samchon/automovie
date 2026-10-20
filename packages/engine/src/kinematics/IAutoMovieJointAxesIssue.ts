/**
 * One defect in a declared joint-axis basis, located at the field that holds
 * it.
 *
 * `validateJointAxesBasis` returns these in order: per axis, each non-finite
 * component or else a zero length; then each non-orthogonal pair; then an
 * unknown twist placement. Motion retargeting forwards each as a range violation, and
 * `normalizeJointAxes` throws the first as `<path> <expected>`.
 *
 * @evidence contracts/common.md#principled-implementation A located violation record in the same path, expectation and value form the engine's violation collector uses, so a retargeting caller forwards it field for field without rewording.
 * @evidence contracts/common.md#clear-and-simple-design Returned as plain data so the throwing normalizer and the collecting retargeter share one validator and each decides whether to stop or report.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `value` carries the offending input itself, never a corrected one, so a report shows what the author actually declared.
 * @evidence contracts/common.md#meaningful-documentation States the producer, the defect kinds and their order, both consumers, and what each field holds including the pair shape for an orthogonality issue.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A located issue record; the per-axis validation pass that fills it is constant work for three axes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built per validation call; nothing is cached.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two strings and a reference to the offending value, at most a handful per basis, released with the caller's report.
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
