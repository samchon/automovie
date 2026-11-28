/**
 * One resident object's enclosed geometry and stable population ordinal.
 *
 * Use one shared XYZ metre frame for the box and partition centre. Candidate
 * collection borrows entries and orders them by the first shared grid cell,
 * then ordinal. Mesh crossing uses triangle entries and lash contact uses
 * capsule entries. Each adds the geometry required by its narrow phase.
 */
export interface IAutoMovieSpatialQueryEntry {
  /** Ordinal in the owner's original resident population, unique per index. */
  ordinal: number;

  /** Componentwise XYZ minima of the enclosing box in metres. */
  low: number[];

  /** Componentwise XYZ maxima of the enclosing box in metres. */
  high: number[];

  /**
   * Finite XYZ partition centre; mesh crossings take it as half-sums of the
   * extrema so it stays finite where `high - low` overflows. It does not alter
   * the box or geometry.
   */
  centre: number[];
}
