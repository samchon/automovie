/**
 * Contiguous span occupied by one canonical planar ring in the shared point
 * array.
 *
 * The canonical span order tiles the region point array. Ear clipping consumes
 * these spans to bridge holes and extrusion follows them to emit boundaries.
 */
export interface IAutoMovieRegionRing {
  /**
   * Zero-based point ordinal in the canonical region. The outer boundary starts
   * at zero.
   */
  start: number;

  /**
   * Number of listed vertices in the ring span, at least three. Closure uses
   * the first point again by index.
   */
  count: number;
}
