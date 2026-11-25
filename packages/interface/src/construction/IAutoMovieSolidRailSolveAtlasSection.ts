/**
 * Successful normal-section rail location on one retained atlas face. The
 * solver returns a fresh mutable record and tuples after its plane/chord
 * residual, retained-region and projected-direction checks. A failed solve
 * returns null instead of this record; this type alone proves no global branch
 * uniqueness or source-domain validity beyond the query path.
 */
export interface IAutoMovieSolidRailSolveAtlasSection {
  /** Zero-based index into the same host atlas's faces array. */
  face: number;

  /**
   * [u,v] in that face's actual chart units, often millimetres/radians but
   * normalized for original profile pieces.
   */
  chart: [number, number];

  /**
   * Original world outward direction projected into the solved tangent plane,
   * expressed as [du,dv] per millimetre of world travel with unit world speed
   * there.
   */
  direction: [number, number];
}
