/**
 * The bounded cost a fluid domain adds to a shot, for the builder report.
 *
 * Every field is derived from the domain record alone, so a production can be
 * refused for an unaffordable water feature before a single step is
 * integrated.
 */
export interface IAutoMovieFluidBudget {
  /** Identity of the measured domain. */
  domain: string;

  /** Lattice cells, `columns * rows`. */
  cells: number;

  /** Velocity faces, `(columns + 1) * rows + columns * (rows + 1)`. */
  faces: number;

  /** Bytes one state occupies as 64-bit reals: `8 * (cells + faces)`. */
  stateBytes: number;

  /** Highest absolute step a sample may integrate to. */
  maxSteps: number;

  /** Cell updates a worst-case seek costs, `cells * maxSteps`. */
  worstCaseCellUpdates: number;

  /** Sum of every emitter's hard particle cap. */
  sprayParticleCap: number;

  /**
   * Courant number `dt * sqrt(g * referenceDepth) * sqrt(1/dx² + 1/dz²)`. At
   * most `1` for a stable explicit solve.
   */
  courant: number;
}
