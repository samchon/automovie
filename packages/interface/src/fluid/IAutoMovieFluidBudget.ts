/**
 * Counts and numerical cost estimates derived by fluidDomainBudget from one
 * fluid domain.
 *
 * No step is integrated. validateFluidDomain checks record budgets of 65,536
 * cells, 100,000 maximum steps, 32 emitters and 4,096 particles per emitter,
 * and rejects a computed Courant value above one. measureRenderSimulation reads
 * cells and sprayParticleCap for bound water bodies.
 */
export interface IAutoMovieFluidBudget {
  /** Id of the measured domain. */
  domain: string;

  /** Lattice cells, `columns * rows`. */
  cells: number;

  /** Velocity faces, `(columns + 1) * rows + columns * (rows + 1)`. */
  faces: number;

  /**
   * Modelled depth/face-velocity payload bytes at eight bytes per scalar, 8 *
   * (cells + faces), excluding per-step scratch arrays and JavaScript container
   * overhead.
   */
  stateBytes: number;

  /** Highest absolute step a sample may integrate to, copied from the solver. */
  maxSteps: number;

  /**
   * Modelled cell updates for a maxSteps replay, cells * maxSteps. Every seek
   * integrates from zero with no retained state cache; source/drain and face
   * work is not a separately timed measurement.
   */
  worstCaseCellUpdates: number;

  /** Sum of every emitter's `maxParticles`, the most spray one sample holds. */
  sprayParticleCap: number;

  /**
   * Courant number dt * sqrt(g * referenceDepth) * sqrt(1/dx² + 1/dz²),
   * computed from the authored design depth. Final binary64 rounding can yield
   * zero or Infinity. The budget reports the number; validateFluidDomain
   * requires a value at most one.
   */
  courant: number;
}
