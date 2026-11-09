import { IAutoMovieConstraintViolation } from "@automovie/interface";

/**
 * Represent a shared clip shape rule failure for sampler and artifact readers.
 *
 * @evidence contracts/development/design.md#principled-representation Relative field, violation kind, message and offending value describe duration, loop or track faults; sampleClip throws its first fault while artifact validation locates and appends the applicable failures.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Fault data separates the shared arithmetic/shape rule from the two consumers' failure presentation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Dense shape faults carry a length or stride instead of echoing every sample, while value faults can retain an offending value; the type does not invent a successful playable track.
 * @evidence contracts/development/common.md#meaningful-documentation Documents relative path joining, message use and diagnostic payload ownership without claiming every fault stores only a scalar.
 */
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
   * Offending diagnostic data. Dense shape faults use a length or stride,
   * while other faults can retain an authored value or empty array.
   */
  value: unknown;
}
