/**
 * The gait cycle a motion carries: the provenance meta that lets a **non-looping composite** (a baked travel, an arranged performance) still answer "where in the stride am I?" at any local time.
 *
 * A looping gait clip answers that by construction (`time % duration`), but the film ladder's compiled performances are non-looping composites, so without this meta the next beat could never resume mid-stride (the #597 continuity handoff). Producers that bake or compose a cyclic locomotion stamp it; consumers compute positive modulo `phase(t) = (phaseAt + t) mod period`. Without this record, a looping clip uses its duration as the cycle and a non-looping clip has no stride phase to resume.
 *
 * @evidence contracts/common.md#principled-implementation Period and initial phase define a clock on a circle independent of clip looping; gaitPhaseOf uses positive modulo and carried metadata before the loop-duration fallback, while composition shifts the phase into its own time origin.
 * @evidence contracts/common.md#clear-and-simple-design Two scalar provenance fields let an ordinary non-looping motion retain stride continuity without retaining its source gait or creating a special cyclic clip representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A composite whose ending motion has no compatible stride drops the metadata instead of fabricating continuity, and invalid carried period or phase yields no resumable cycle rather than NaN.
 * @evidence contracts/common.md#meaningful-documentation Gives second units, positive period, normalized initial phase, composition offset formula and the distinction between explicit cycle metadata and the looping-duration fallback.
 * @author Samchon
 */
export interface IAutoMovieGaitCycle {
  /** The source gait's cycle length, seconds. Strictly positive. */
  period: number;

  /**
   * Cycle phase at the motion's local `t = 0`, seconds in `[0, period)`. A bake wraps its supplied phase seed, defaulting to `0`; arranging a segment starting at `s` shifts that seed to `phaseAt = (seed - s) mod period` so the composite's own clock still lands on the segment's stride phase.
   */
  phaseAt: number;
}
