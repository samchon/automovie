import { IAutoMovieFluidSprayParticle } from "./IAutoMovieFluidSprayParticle";

/**
 * One bounded decorative spray sample at an absolute step, from
 * `sampleFluidSpray`.
 *
 * `step` and `time` are the solved state's own, so spray shares the fluid's
 * snapped clock rather than the raw shot second. `sampleFluidSpray` throws when
 * the state belongs to another domain or the camera distance is not finite.
 *
 * @evidence contracts/common.md#principled-implementation `sampleFluidSpray` copies `step` and `time` from the `IAutoMovieFluidState` it is given and walks each emitter's live spawn indices newest-first, so the sample and the surface of one frame always describe the same instant.
 * @evidence contracts/common.md#clear-and-simple-design One flat particle list ordered by emitter and spawn index serves the viewer's single point cloud, with the emitter id on each particle instead of a nested per-emitter structure.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The clock is never re-derived from a shot second here, and the refusals for a foreign state or a non-finite distance replace what would otherwise be an empty or misplaced sample.
 * @evidence contracts/common.md#meaningful-documentation States the producer, whose clock the sample uses, and both refusals; members give the step and time meaning and the particle order, bounds and empty case.
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
