/**
 * An interior plan anchor selected from the largest-area convex footprint
 * piece.
 *
 * X and z are world-plan metres inherited from the footprint; no height or
 * orientation is inferred. The footprint decomposition owns ring hygiene; null
 * means no positive-area piece survived, including rejected or degenerate
 * footprints. Equal-area ties keep the first piece.
 */
export namespace IAutoMovieFootprintInteriorPoint {
  /**
   * Choose an anchor from the widest convex piece of a footprint.
   *
   * A fresh coordinate record or null when decomposition yields no
   * positive-area piece. The anchor is the chosen piece's vertex mean, not its
   * area centroid or the whole footprint's centroid; height is deliberately
   * absent.
   */
  export type IResult = IAnchor | null;

  /** Plan coordinates of a vertex-mean anchor on the selected convex piece. */
  export type IAnchor = {
    /**
     * Fresh anchor's world X coordinate in metres, the arithmetic mean of the
     * chosen convex piece's vertex x values.
     */
    x: number;

    /**
     * Fresh anchor's world Z coordinate in metres, paired with x; height must
     * be evaluated by the surface owner.
     */
    z: number;
  };
}
