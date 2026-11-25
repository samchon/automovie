/**
 * Planar point pairs read by the hand's convex-hull tape calculation. Runtime
 * construction and admission remain with AutoMovieHumanHandVector in Human.
 */
export namespace IAutoMovieHumanHandVector {
  /**
   * Borrowed planar section points [x, y] in millimetres. The hand tape reader
   * takes the perimeter of their convex hull, so their input order need not
   * trace a polygon.
   */
  export type HullPoints = readonly [number, number][];
}
