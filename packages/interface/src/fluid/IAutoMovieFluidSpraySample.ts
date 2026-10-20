import { IAutoMovieFluidSprayParticle } from "./IAutoMovieFluidSprayParticle";

/**
 * One bounded decorative spray sample returned by sampleFluidSpray.
 *
 * Step and time are copied from the supplied state's snapped clock rather than recalculated from a shot second. sampleFluidSpray rejects a mismatched domain id or nonfinite camera distance; it does not independently validate every state field.
 *
 * @evidence contracts/common.md#principled-implementation `sampleFluidSpray` copies `step` and `time` from the `IAutoMovieFluidState` it is given and walks each emitter's live spawn indices newest-first, so the sample and the surface of one frame always describe the same instant.
 * @evidence contracts/common.md#clear-and-simple-design One flat particle list ordered by emitter and spawn index serves the viewer's single point cloud, with the emitter id on each particle instead of a nested per-emitter structure.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The clock is never re-derived from a shot second here, and the refusals for a foreign state or a non-finite distance replace what would otherwise be an empty or misplaced sample.
 * @evidence contracts/common.md#meaningful-documentation States the producer, whose clock the sample uses, and both refusals; members give the step and time meaning and the particle order, bounds and empty case.
 */
export interface IAutoMovieFluidSpraySample {
  /** Absolute integer step index sampled. */
  step: number;

  /** Absolute domain-clock second sampled, `step * solver.fixedStepSeconds`. */
  time: number;

  /**
   * Live particles after distance thinning and the per-emitter cap, grouped in domain.sprays order and returned in spawn-index order within each. Empty when no particle survives; extreme index arithmetic retains the emitter/particle types' documented limits.
   */
  particles: IAutoMovieFluidSprayParticle[];
}
