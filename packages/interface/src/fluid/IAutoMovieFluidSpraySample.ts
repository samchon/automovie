import { IAutoMovieFluidSprayParticle } from "./IAutoMovieFluidSprayParticle";

/**
 * One bounded decorative spray sample at an absolute step, from
 * `sampleFluidSpray`.
 *
 * `step` and `time` are the solved state's own, so spray shares the fluid's
 * snapped clock rather than the raw shot second.
 *
 * @evidence contracts/common.md#principled-implementation Samples every emitter at the fluid state's time rather than the raw shot second, so spray and surface read one fixed step and captures at different frame rates inside that step agree.
 * @evidence contracts/common.md#clear-and-simple-design A flat particle list with the step and time it was taken at, so one viewer upload covers every emitter of a domain without nesting per emitter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No emitter or distance is special-cased; a negative camera distance thins nothing and a non-finite one throws in `sampleFluidSpray` instead of returning an empty list.
 * @evidence contracts/common.md#meaningful-documentation States which clock the sample uses, the order of particles, that both bounds were already applied, and that an empty list means nothing is alive.
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
