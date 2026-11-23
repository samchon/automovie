/**
 * The gait cycle a motion carries: the provenance meta that lets a
 * **non-looping composite** (a baked travel, an arranged performance) still
 * answer "where in the stride am I?" at any local time.
 *
 * A looping gait clip answers that by construction (`time % duration`), but the
 * film ladder's compiled performances are non-looping composites, so without
 * this meta the next beat could never resume mid-stride (the #597 continuity
 * handoff). Producers that bake or compose a cyclic locomotion stamp it;
 * consumers compute positive modulo `phase(t) = (phaseAt + t) mod period`.
 * Without this record, a looping clip uses its duration as the cycle and a
 * non-looping clip has no stride phase to resume.
 */
export interface IAutoMovieGaitCycle {
  /** The source gait's cycle length, seconds. Strictly positive. */
  period: number;

  /**
   * Cycle phase at the motion's local `t = 0`, seconds in `[0, period)`. A bake
   * wraps its supplied phase seed, defaulting to `0`; arranging a segment
   * starting at `s` shifts that seed to `phaseAt = (seed - s) mod period` so
   * the composite's own clock still lands on the segment's stride phase.
   */
  phaseAt: number;
}
