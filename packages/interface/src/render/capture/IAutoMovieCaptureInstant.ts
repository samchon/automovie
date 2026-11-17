/**
 * One named instant of a subject.
 *
 * Seconds belong to the described subject's clock; no conversion to action elapsed time or another film clock is implied. Capture planning matches the label at millisecond text precision. The subject producer supplies meaningful finite times within its clock.
 *
 * @evidence contracts/development/design.md#principled-representation A second of the subject's clock and the words that name what happens then.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Subject description, capture captions and capture-round timing share named instants without adopting a motion-action vocabulary.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The label is free text the subject's owner writes; no beat vocabulary is named here.
 * @evidence contracts/development/common.md#meaningful-documentation States what each member holds and its unit.
 */
export interface IAutoMovieCaptureInstant {
  /** The instant, seconds of the subject's clock. */
  seconds: number;

  /** What happens then, such as `heel strike`. */
  label: string;
}
