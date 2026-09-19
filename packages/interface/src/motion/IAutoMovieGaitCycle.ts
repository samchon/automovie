/**
 * The gait cycle a motion carries: the provenance meta that lets a
 * **non-looping composite** (a baked travel, an arranged performance) still
 * answer "where in the stride am I?" at any local time.
 *
 * A looping gait clip answers that by construction (`time % duration`), but the
 * film ladder's compiled performances are non-looping composites, so without
 * this meta the next beat could never resume mid-stride (the #597 continuity
 * handoff). Producers that bake or compose a cyclic locomotion stamp it;
 * consumers compute `phase(t) = (phaseAt + t) % period`. Absent means the
 * motion carries no cycle to resume: a one-shot.
 *
 * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-gait-table Exposes `IAutoMovieGaitCycle` as the portable data boundary for the motion gait table requirement.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Types `IAutoMovieGaitCycle` for the performance kinematics procedural gait rule system contract.
 * @author Samchon
 */
export interface IAutoMovieGaitCycle {
  /**
   * The source gait's cycle length, seconds. Strictly positive.
   *
   * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-gait-table Exposes `period` as the portable data boundary for the motion gait table requirement.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Types `period` for the performance kinematics procedural gait rule system contract.
   */
  period: number;

  /**
   * Cycle phase at the motion's local `t = 0`, seconds in `[0, period)`. A
   * fresh bake is `0`; composition offsets shift it (an arranged segment
   * starting at `s` carries `phaseAt = (0 - s) mod period` so the composite's
   * own clock still lands on the segment's true stride phase).
   *
   * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-gait-table Exposes `phaseAt` as the portable data boundary for the motion gait table requirement.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Types `phaseAt` for the performance kinematics procedural gait rule system contract.
   */
  phaseAt: number;
}
