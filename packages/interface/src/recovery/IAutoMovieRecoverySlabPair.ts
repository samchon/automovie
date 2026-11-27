/**
 * One finite source interval bounded by two explicitly requested section
 * planes.
 */
export interface IAutoMovieRecoverySlabPair {
  /** Lower physical coordinate, millimetres along the normalized section axis. */
  beforeMm: number;

  /**
   * Upper physical coordinate, strictly greater than beforeMm, also explicitly
   * requested.
   */
  afterMm: number;
}
