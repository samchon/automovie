/**
 * A refused geometric chart transport that leaves its source course with the caller.
 *
 * @evidence contracts/common.md#principled-implementation A false admission discriminator and diagnostics expose an unresolved relation without publishing a fabricated transported row.
 * @evidence contracts/common.md#clear-and-simple-design Refusal is a distinct result arm, separate from malformed-input exceptions and successful transport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Failure supplies no substitute phase, source course or guessed correspondence.
 * @evidence contracts/common.md#meaningful-documentation States admission, diagnostics and unchanged caller ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased result performs no admission.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller retains the original course and owns returned diagnostics.
 */
export interface IAutoMovieRecoveryObservationTransportRefused {
  /** No transported row was admitted. */
  admitted: false;

  /** Causes that prevented an ordered, representable geometric transport. */
  diagnostics: string[];

  /** The operation leaves the caller's original observations untouched. */
  originalCourseRetainedByCaller: true;
}
