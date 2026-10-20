/** Read-only floor-relative height diagnostics, mm. */
export interface IAutoMovieHumanBodyHeightDiagnostics {
  /** Crotch-to-floor height, mm, distinct from inseam; null means unmeasured. */
  rise: number | null;

  /** Shoulder-to-floor height, mm; clinical acromial correspondence is unestablished. Null means unmeasured. */
  shoulderHeight: number | null;
}
