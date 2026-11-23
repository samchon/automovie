/**
 * One named instant of a subject.
 *
 * Seconds belong to the described subject's clock; no conversion to action
 * elapsed time or another film clock is implied. Capture planning matches the
 * label at millisecond text precision. The subject producer supplies meaningful
 * finite times within its clock.
 */
export interface IAutoMovieCaptureInstant {
  /** The instant, seconds of the subject's clock. */
  seconds: number;

  /** What happens then, such as `heel strike`. */
  label: string;
}
