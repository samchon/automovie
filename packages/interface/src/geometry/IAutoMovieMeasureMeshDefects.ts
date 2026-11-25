/**
 * Borrowed mesh buffers and lattice-weld policy for edge-incidence inspection.
 *
 * Positions use one common length unit, weld counts cells per unit, and the
 * optional sliver threshold is a dimensionless edge-to-height ratio. The
 * producer checks triple layouts, index bounds, positive finite options and
 * finite lattice coordinates; vertex-fan singularities and intersecting
 * surfaces are outside this edge-incidence measure.
 */
export namespace IAutoMovieMeasureMeshDefects {
  /**
   * Triangle buffers for locating edge-incidence defects by their carrying
   * vertices.
   *
   * `positions` is flat xyz in any one length unit and `indices` holds triangle
   * corners, or is `null` for a non-indexed list whose every three vertices are
   * one triangle. Both are read in place, typed arrays included, and neither is
   * changed. Vertices weld by position: each coordinate is multiplied by
   * `options.weld`, the number of lattice cells per unit of length, and rounded
   * to the nearest whole cell, and vertices in the same cell on all three axes
   * are one corner. The default is `MESH_WELD_GRID`, a nanometre grid when the
   * unit is the metre. Welding by cell is not welding by distance: two points
   * closer than a cell that fall on either side of a rounding boundary stay
   * apart.
   *
   * A triangle whose corners weld onto fewer than three cells is `degenerate`
   * and contributes no edges. Every other triangle contributes its three edges
   * between welded corners. An edge used by exactly one triangle is `open`, by
   * more than two `non-manifold`, and by exactly two that traverse it in the
   * same direction `inconsistent`, which is also what a triangle stored twice
   * reports on all three edges. A non-manifold edge is not tested for winding.
   * `sliver` is reported only when `options.sliver` is given: a triangle on
   * three distinct cells whose aspect, its longest edge squared divided by
   * twice its area, exceeds that limit. The aspect is dimensionless and equals
   * the longest edge over the height standing on it: `2 / sqrt(3)` for an
   * equilateral triangle, 2 for a right isosceles one, and infinite for
   * collinear corners on distinct cells. It is measured on the stored
   * positions, not on the lattice.
   *
   * Defects come in ascending order of the first triangle that carries them.
   * Within one triangle its own `degenerate` or `sliver` defect comes first,
   * then its edges in corner order: corner 0 to 1, 1 to 2, 2 to 0. An edge is
   * listed once, at the first triangle that uses it. The same input always
   * gives the same list.
   *
   * It throws a named `Error` for a position count not divisible by three, a
   * corner count not divisible by three, an index that is not a whole number
   * inside the position buffer, a `weld` or `sliver` that is not positive and
   * finite, a vertex whose lattice coordinate is not finite, and more than 94
   * 906 265 vertices. Only edge incidence is measured: a vertex where two fans
   * touch and surfaces that cross each other are not found here.
   */
  export type IMesh = {
    /**
     * Borrowed flat xyz coordinates, three per vertex, in one common frame and
     * length unit; typed arrays are accepted and every weld-scaled coordinate
     * must remain finite.
     */
    positions: ArrayLike<number>;

    /**
     * Borrowed zero-based triangle vertex indices in triples, or null for
     * successive triples of vertices; empty buffers describe an empty mesh.
     */
    indices: ArrayLike<number> | null;
  };

  /**
   * Lattice identity and optional sliver classification for mesh-defect
   * measurement. Welding rounds each scaled coordinate independently; close
   * points on different rounding cells remain separate. Sliver aspect is
   * measured on stored positions, not on the lattice, and equals longest edge
   * divided by its altitude.
   *
   * Options are borrowed for one synchronous call; their numeric ranges are
   * checked by measureAutoMovieMeshDefects before inspection. Omission uses the
   * documented lattice default and disables only sliver classification.
   */
  export type IOptions = {
    /**
     * Positive finite lattice cells per position unit; omitted uses
     * MESH_WELD_GRID = 1e9, a nanometre grid for metre input. Rounding cells
     * defines identity, not pairwise distance.
     */
    weld?: number;

    /**
     * Positive finite dimensionless longest-edge/altitude threshold; omitted
     * disables sliver reporting. Only three-distinct-cell triangles whose
     * stored-position aspect exceeds it are reported.
     */
    sliver?: number;
  };
}
