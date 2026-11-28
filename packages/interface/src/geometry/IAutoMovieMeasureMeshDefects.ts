/**
 * Input buffers and measurement parameters for position-lattice incidence and
 * optional triangle aspect classification.
 */
export namespace IAutoMovieMeasureMeshDefects {
  /**
   * Borrowed packed XYZ positions and optional explicit triangle indices, using
   * one coordinate frame and unit. Use finite weld-scaled coordinates and whole
   * in-range indices.
   *
   * Lattice welding rounds each coordinate multiplied by the weld factor.
   * Points on opposite sides of a rounding boundary stay separate.
   * Lattice-collapsed triangles contribute no edges. The measure reports sliver
   * aspect from the stored positions of triangles on distinct cells.
   *
   * The output is ordered by the first triangle carrying a defect. Within one
   * triangle, its own defect precedes its reported edges in stored corner
   * order. An edge is reported at most once. The operation checks complete XYZ
   * and triangle triples and caps source vertices at 94,906,265 so packed edge
   * keys stay exact.
   */
  export type IMesh = {
    /**
     * Borrowed xyz components, three per vertex. Every coordinate must have a
     * finite lattice product to describe a usable cell.
     */
    positions: ArrayLike<number>;

    /**
     * Borrowed zero-based whole triangle corner ordinals or null for
     * consecutive triples of vertices. Empty buffers describe an empty mesh.
     */
    indices: ArrayLike<number> | null;
  };

  /**
   * Positional lattice resolution and an optional dimensionless triangle aspect
   * threshold. Supply finite positive values.
   */
  export type IOptions = {
    /**
     * Positive finite lattice cells per coordinate unit. Omission uses 1e9,
     * corresponding to a nanometre grid for metre positions.
     */
    weld?: number;

    /**
     * Positive finite dimensionless longest-edge-to-altitude threshold.
     * Omission disables sliver classification.
     *
     * For three distinct lattice cells, the threshold compares against the
     * longest stored edge divided by its altitude. Collinear stored corners
     * yield an infinite aspect.
     */
    sliver?: number;
  };
}
