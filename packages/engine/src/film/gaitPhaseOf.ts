import { IAutoMovieGaitCycle, IAutoMovieMotion } from "@automovie/interface";

import { addPositiveModulo } from "../math/addPositiveModulo";
import { positiveModulo } from "../math/positiveModulo";

/**
 * Seconds into a clip's stride cycle at `localTime`, or `null` when the clip states no cycle to resume.
 *
 * A carried `gaitCycle` is authoritative: it is how a non-looping composite, such as the film ladder's arranged performance, still knows its stride phase, and the answer is `(phaseAt + localTime) mod period`. A cycle with a non-positive or non-finite period, or a non-finite `phaseAt`, answers `null` rather than a `NaN` phase. Without a cycle, a looping clip answers `localTime mod duration`, the wrap the motion sampler applies, and a one-shot clip or a looping clip of non-positive duration answers `null`. The phase is in `[0, period)` seconds. `resolveBeatEnd` and `resolveBeatOpening` store it as an actor's `gaitPhase`, which the next beat resumes mid-stride from.
 *
 * @param clip The validated clip the actor plays.
 * @param localTime Clip-local seconds at the instant being resumed from.
 * @returns The phase in seconds, or `null` when there is no cycle.
 *
 * @evidence contracts/common.md#principled-implementation A stride phase is a position on a circle of circumference `period`, so it is computed with the repository's positive modulo, and the carried phase plus elapsed time with `addPositiveModulo`, which normalizes both terms first so an in-range phase plus a whole period returns the same bits; it relies on a validated clip with a finite duration, and degenerate cycle fields answer `null` instead of propagating `NaN`.
 * @evidence contracts/common.md#clear-and-simple-design One phase rule read by both beat-boundary resolvers, so the end of one beat and the opening of the next can never disagree about where a stride is; the loop branch reuses `positiveModulo` instead of a private wrap.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no clip, gait or rig; the carried cycle wins over `loop` because it is the clip's own statement of its stride, and every degenerate form answers `null` by the same rule.
 * @evidence contracts/common.md#meaningful-documentation States which source wins, the formula for each branch, every `null` case, the unit and range of the phase, and which resolvers store it.
 * @evidence contracts/performance.md#efficient-algorithms Fixed scalar work delegates wrapping to positiveModulo or addPositiveModulo; no keyframe or joint population is traversed.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure scalar of one clip and one instant that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates and retains nothing; it returns a number.
 */
export function gaitPhaseOf (
  clip: IAutoMovieMotion,
  localTime: number,
): number | null {
  const cycle: IAutoMovieGaitCycle | null = clip.gaitCycle ?? null;
  if (cycle !== null) {
    if (!Number.isFinite(cycle.period) || cycle.period <= 0) return null;
    if (!Number.isFinite(cycle.phaseAt)) return null;
    return addPositiveModulo(cycle.phaseAt, localTime, cycle.period);
  }
  if (!clip.loop || clip.duration <= 0) return null;
  return positiveModulo(localTime, clip.duration);
}
