/**
 * Ordered generating polyline in model-local metres, published by support-loft
 * emission and recovery and borrowed by construction display. Closed paths omit
 * the repeated first point. buildAutoMovieConstruction additionally requires
 * unique nonempty ids, finite float32-representable coordinates and at least
 * two open or three closed points within its point budget; it draws supplied
 * samples without refitting. Emitted curves can share point tuples at common
 * stations.
 */
export interface IAutoMovieConstructionPolyline {
  /** Nonempty unique line identity assigned to its rendered object. */
  id: string;
  /** Whether the final point connects to the first without a repeated endpoint. */
  closed: boolean;
  /**
   * Ordered xyz model-local metre samples; array is borrowed read-only,
   * individual tuples retain their existing mutable type.
   */
  points: readonly [number, number, number][];
}

/**
 * Producer-owned mutable list view; point tuples may still be shared across
 * curves.
 */
export namespace IAutoMovieConstructionPolyline {
  /** Mutable construction publication from support-loft or recovery realization. */
  export interface IMutable extends IAutoMovieConstructionPolyline {
    /**
     * Ordered model-local metre samples; copy shared tuples before independent
     * edits.
     */
    points: [number, number, number][];
  }
}
