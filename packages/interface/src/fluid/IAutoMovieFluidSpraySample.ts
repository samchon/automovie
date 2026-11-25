import type { IAutoMovieFluidSprayParticle } from "./IAutoMovieFluidSprayParticle";

/**
 * One bounded decorative spray sample returned by sampleFluidSpray.
 *
 * Step and time are copied from the supplied state's snapped clock rather than
 * recalculated from a shot second. sampleFluidSpray rejects a mismatched domain
 * id or nonfinite camera distance; it does not independently validate every
 * state field.
 */
export interface IAutoMovieFluidSpraySample {
  /** Absolute integer step index sampled. */
  step: number;

  /** Absolute domain-clock second sampled, `step * solver.fixedStepSeconds`. */
  time: number;

  /**
   * Live particles after distance thinning and the per-emitter cap, grouped in
   * domain.sprays order and returned in spawn-index order within each. Empty
   * when no particle survives; extreme index arithmetic retains the
   * emitter/particle types' documented limits.
   */
  particles: IAutoMovieFluidSprayParticle[];
}
