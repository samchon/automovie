/**
 * One canonical cue parsed from final strict-UTF8 WebVTT bytes in delivery order.
 *
 * @evidence contracts/common.md#principled-implementation The media probe reads WebVTT timing grammar into exact integer millisecond boundaries while preserving delivered identifier and payload; final caption verification compares the complete canonical text against the current plan.
 * @evidence contracts/common.md#clear-and-simple-design Four fields expose one cue without retaining parser state or treating NOTE, STYLE and REGION blocks as timed captions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent cue id remains null and delivered ordering and text are preserved; malformed timing is refused rather than reordered, repaired or inferred from another cue.
 * @evidence contracts/common.md#meaningful-documentation Defines nullable delivered id, complete payload and inclusive-start exclusive-end millisecond timing.
 * @author Samchon
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
