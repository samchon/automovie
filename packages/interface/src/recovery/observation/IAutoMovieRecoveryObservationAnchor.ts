/**
 * One uniquely shared identity relating incoming and current observation
 * cycles.
 */
export interface IAutoMovieRecoveryObservationAnchor {
  /** Identity appearing exactly once in each input cycle. */
  id: string;

  /** Zero-based point ordinal in the incoming cycle. */
  previousIndex: number;

  /** Retained incoming canonical phase in [0, 1). */
  phase: number;

  /**
   * Zero-based point ordinal in the original current cycle, before transport
   * ordering.
   */
  currentIndex: number;
}
