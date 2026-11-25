import type { IAutoMovieConstraintViolation } from "./IAutoMovieConstraintViolation";

/** Represent a shared clip shape rule failure for sampler and artifact readers. */
export interface IAutoMovieClipShapeFault {
  /** Violation kind the artifact gate reports this fault as. */
  kind: IAutoMovieConstraintViolation["kind"];

  /**
   * Field carrying the fault, relative to the track (or the clip, for
   * {@link clipDurationFault} / {@link clipLoopFault}), e.g. `values`,
   * `times[2]`, `interpolation`. The gate joins it onto its own path; the
   * sampler ignores it, because its message already names the field.
   */
  field: string;

  /**
   * The fault as a sentence, with no subject: the sampler reads it after `track
   * "<channel key>"`, the gate reads it as a violation's `expected`.
   */
  message: string;

  /**
   * Offending diagnostic data. Dense shape faults use a length or stride, while
   * other faults can retain an authored value or empty array.
   */
  value: unknown;
}
