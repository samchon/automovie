/**
 * Counts and numerical cost estimates derived by fluidDomainBudget from one fluid domain.
 *
 * No step is integrated. validateFluidDomain checks record budgets of 65,536 cells, 100,000 maximum steps, 32 emitters and 4,096 particles per emitter, and rejects a computed Courant value above one; a derived NaN is not rejected by that comparison. measureRenderSimulation reads cells and sprayParticleCap for bound water bodies.
 *
 * @evidence contracts/common.md#principled-implementation Every field is a closed-form count over the grid and emitters, the face count following the Arakawa C staggering of one more face than cells along the crossed axis, and `courant` comes from the same `fluidCourantNumber` the validator checks.
 * @evidence contracts/common.md#clear-and-simple-design One flat record of derived numbers serves both the render metrics and a reviewer, with the refusal thresholds kept in `validateFluidDomain` rather than duplicated as fields here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Counts model uncached replay and stored scalar-array payload, excluding per-step scratch arrays, JavaScript container overhead and physical runtime duration. The reported Courant value uses direct arithmetic and can be nonfinite; this record is neither domain admission nor a measured memory/runtime bound.
 * @evidence contracts/common.md#meaningful-documentation States the producer, that no step is integrated, every limit the validator enforces, and which consumer reads which fields; members give each formula, its unit, and what it leaves out.
 * @author Samchon
 */
export interface IAutoMovieFluidBudget {
  /** Id of the measured domain. */
  domain: string;

  /** Lattice cells, `columns * rows`. */
  cells: number;

  /** Velocity faces, `(columns + 1) * rows + columns * (rows + 1)`. */
  faces: number;

  /**
   * Modelled depth/face-velocity payload bytes at eight bytes per scalar, 8 * (cells + faces), excluding per-step scratch arrays and JavaScript container overhead.
   */
  stateBytes: number;

  /** Highest absolute step a sample may integrate to, copied from the solver. */
  maxSteps: number;

  /**
   * Modelled cell updates for a maxSteps replay, cells * maxSteps. Every seek integrates from zero with no retained state cache; source/drain and face work is not a separately timed measurement.
   */
  worstCaseCellUpdates: number;

  /** Sum of every emitter's `maxParticles`, the most spray one sample holds. */
  sprayParticleCap: number;

  /**
   * Courant number dt * sqrt(g * referenceDepth) * sqrt(1/dx² + 1/dz²), computed at design depth rather than solved depth. The analytic bound is at most one; direct intermediate products may overflow or produce NaN, and the budget reports that result without validation.
   */
  courant: number;
}
