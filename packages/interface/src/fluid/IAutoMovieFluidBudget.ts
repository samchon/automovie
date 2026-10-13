/**
 * The bounded cost a fluid domain adds to a shot, as `fluidDomainBudget` derives
 * it from the domain record alone.
 *
 * Nothing here integrates a step, so the cost is known before the first solve.
 * `validateFluidDomain` refuses an unaffordable domain on the same limits (cell
 * cap, step cap, Courant number) read from the record directly; the render
 * simulation metrics read `cells` and `sprayParticleCap` from this record.
 *
 * @author Samchon
 */
export interface IAutoMovieFluidBudget {
  /** Identity of the measured domain. */
  domain: string;

  /** Lattice cells, `columns * rows`. */
  cells: number;

  /** Velocity faces, `(columns + 1) * rows + columns * (rows + 1)`. */
  faces: number;

  /**
   * Bytes of one state's depth and face-velocity arrays as 64-bit reals, `8 *
   * (cells + faces)`. The solver's per-step scratch arrays are not counted.
   */
  stateBytes: number;

  /** Highest absolute step a sample may integrate to. */
  maxSteps: number;

  /**
   * Cell updates a seek to `maxSteps` costs, `cells * maxSteps`. Nothing is
   * cached between seeks, so every seek integrates from step 0.
   */
  worstCaseCellUpdates: number;

  /** Sum of every emitter's hard particle cap. */
  sprayParticleCap: number;

  /**
   * Courant number `dt * sqrt(g * referenceDepth) * sqrt(1/dx² + 1/dz²)`,
   * computed at the design depth rather than the current one. At most `1` for
   * a stable explicit solve.
   */
  courant: number;
}
