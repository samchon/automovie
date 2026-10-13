/**
 * The bounded cost a fluid domain adds to a shot, as `fluidDomainBudget` derives
 * it from the domain record alone.
 *
 * Nothing here integrates a step, so the cost is known before the first solve.
 * `validateFluidDomain` refuses an unaffordable domain on its own limits read
 * from the record directly: at most 65,536 cells, `maxSteps` at most 100,000, a
 * Courant number at most `1`, and at most 32 emitters of at most 4,096
 * particles each. `measureRenderSimulation` reads `cells` and
 * `sprayParticleCap` from this record for every bound water body.
 *
 * @evidence contracts/common.md#principled-implementation Every field is a closed-form count over the grid and emitters, the face count following the Arakawa C staggering of one more face than cells along the crossed axis, and `courant` comes from the same `fluidCourantNumber` the validator checks.
 * @evidence contracts/common.md#clear-and-simple-design One flat record of derived numbers serves both the render metrics and a reviewer, with the refusal thresholds kept in `validateFluidDomain` rather than duplicated as fields here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record states the solver's real cost model, including that seeks are not cached and that per-step scratch arrays are excluded from `stateBytes`, instead of an optimistic figure.
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
   * Bytes of one state's depth and face-velocity arrays as 64-bit reals,
   * `8 * (cells + faces)`. The solver's per-step scratch arrays are not
   * counted.
   */
  stateBytes: number;

  /** Highest absolute step a sample may integrate to, copied from the solver. */
  maxSteps: number;

  /**
   * Cell updates a seek to `maxSteps` costs, `cells * maxSteps`. Nothing is
   * cached between seeks, so every seek integrates from step 0.
   */
  worstCaseCellUpdates: number;

  /** Sum of every emitter's `maxParticles`, the most spray one sample holds. */
  sprayParticleCap: number;

  /**
   * Courant number `dt * sqrt(g * referenceDepth) * sqrt(1/dx² + 1/dz²)`,
   * computed at the design depth rather than any solved depth. At most `1` for
   * a stable explicit solve.
   */
  courant: number;
}
