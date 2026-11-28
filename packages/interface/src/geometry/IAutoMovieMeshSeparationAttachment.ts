/**
 * Three-vertex fan root registration against a source triangle and its incident
 * support faces at zero requested clearance.
 *
 * A support absent from the list still requires strict separation. When that
 * face touches the root, the needed proof fails. Each admitted support instead
 * needs a contact cap.
 */
export interface IAutoMovieMeshSeparationAttachment {
  /**
   * Original resident ordinal of the source triangle used to recompute the
   * canonical root seat.
   */
  triangle: number;

  /**
   * Three finite nonnegative weights in source triangle corner order whose
   * outward sum encloses one. The interpolated seat is rounded to Float32 when
   * that representation was requested.
   */
  weights: readonly number[];

  /**
   * Nonempty original triangle ordinal sequence including the seat triangle.
   * Each listed triangle must contain every positive-weight seat corner.
   */
  supports: readonly number[];
}
