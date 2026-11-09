/**
 * One canonical cue parsed from final strict-UTF8 WebVTT bytes in delivery order.
 *
 * @evidence contracts/development/design.md#principled-representation The media probe reads WebVTT timing grammar into exact integer millisecond boundaries while preserving delivered identifier and payload; final caption verification compares the complete canonical text against the current plan.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four fields expose one cue without retaining parser state or treating NOTE, STYLE and REGION blocks as timed captions.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Absent cue id remains null and delivered ordering and text are preserved; malformed timing is refused rather than reordered, repaired or inferred from another cue.
 * @evidence contracts/development/common.md#meaningful-documentation Defines nullable delivered id, complete payload and inclusive-start exclusive-end millisecond timing.
 */
export interface IAutoMovieProductionWebVttCue {
  /** Delivered cue identifier, if present. */
  id: string | null;

  /** Complete delivered cue payload. */
  text: string;

  /** Exact parsed cue-start millisecond. */
  startMilliseconds: number;

  /** Exact parsed exclusive cue-end millisecond. */
  endMilliseconds: number;
}
