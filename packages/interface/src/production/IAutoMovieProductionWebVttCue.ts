/**
 * One canonical cue parsed from final strict-UTF8 WebVTT bytes in delivery
 * order.
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
