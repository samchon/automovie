import { IAutoMovieFluidSprayParticle } from "./IAutoMovieFluidSprayParticle";

/**
 * One bounded decorative spray sample at an absolute step, from
 * `sampleFluidSpray`.
 *
 * `step` and `time` are the solved state's own, so spray shares the fluid's
 * snapped clock rather than the raw shot second.
 *
 * @author Samchon
 */
export interface IAutoMovieFluidSpraySample {
  /** Absolute integer step index sampled. */
  step: number;

  /** Absolute domain-clock second sampled, `step * solver.fixedStepSeconds`. */
  time: number;

  /**
   * Live particles after distance thinning and the hard per-emitter cap,
   * grouped by emitter in `domain.sprays` order and in ascending spawn index
   * within each; empty when nothing is alive.
   */
  particles: IAutoMovieFluidSprayParticle[];
}
