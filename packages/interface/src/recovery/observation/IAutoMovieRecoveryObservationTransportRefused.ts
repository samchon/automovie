/**
 * A refused geometric chart transport that leaves its source course with the
 * caller.
 */
export interface IAutoMovieRecoveryObservationTransportRefused {
  /** No transported row was admitted. */
  admitted: false;

  /** Causes that prevented an ordered, representable geometric transport. */
  diagnostics: string[];

  /** The operation leaves the caller's original observations untouched. */
  originalCourseRetainedByCaller: true;
}
