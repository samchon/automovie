

/**
 * Successful normal-section rail location on one retained atlas face.
 * The solver returns a fresh mutable record and tuples after its plane/chord
 * residual, retained-region and projected-direction checks. A failed solve
 * returns null instead of this record; this type alone proves no global branch
 * uniqueness or source-domain validity beyond the query path.
 *
 * @evidence contracts/development/design.md#principled-representation A face index gives both coordinates and direction one unambiguous chart; direction has unit world speed at the solved point.
 * @evidence contracts/development/design.md#minimal-and-owned-surface SolidRailSolve.atlas returns this location to SolidRail for final source-jet evaluation and rail publication.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Runtime solve/admission owns numerical success; a plain record does not certify another face, another query or global geometry.
 * @evidence contracts/development/common.md#meaningful-documentation States chart/direction units, fresh ownership and nullable failure at the producer boundary.
 */
export interface IAutoMovieSolidRailSolveAtlasSection {
  /** Zero-based index into the same host atlas's faces array. */
  face: number;

  /** [u,v] in that face's actual chart units, often millimetres/radians but normalized for original profile pieces. */
  chart: [number, number];

  /** Original world outward direction projected into the solved tangent plane, expressed as [du,dv] per millimetre of world travel with unit world speed there. */
  direction: [number, number];
}
