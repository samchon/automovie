/**
 * Qualified calibrated point candidate from a registered track, with available
 * refusal reasons.
 */
export interface IAutoMovieRecoverySceneTriangulation {
  /**
   * Qualified world point in the common unit-seed-baseline gauge, or null when
   * withheld.
   */
  point: [number, number, number] | null;

  /** Design or geometry diagnostics for a withheld candidate. */
  reasons: string[];
}
