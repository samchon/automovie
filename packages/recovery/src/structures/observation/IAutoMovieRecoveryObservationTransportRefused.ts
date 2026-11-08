/**
 * A refused geometric chart transport that leaves its source course with the caller.
 *
 * @evidence contracts/development/design.md#principled-representation A false admission discriminator and diagnostics expose an unresolved relation without publishing a fabricated transported row.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Refusal is a distinct result arm, separate from malformed-input exceptions and successful transport.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Failure supplies no substitute phase, source course or guessed correspondence.
 * @evidence contracts/development/common.md#meaningful-documentation States admission, diagnostics and unchanged caller ownership.
 */
export interface IAutoMovieRecoveryObservationTransportRefused {
  /** No transported row was admitted. */
  admitted: false;

  /** Causes that prevented an ordered, representable geometric transport. */
  diagnostics: string[];

  /** The operation leaves the caller's original observations untouched. */
  originalCourseRetainedByCaller: true;
}
