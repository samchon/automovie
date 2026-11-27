import { IAutoMovieGaitCycle, IAutoMovieMotion } from "@automovie/interface";

import { addPositiveModulo } from "../../math/internal/addPositiveModulo";
import { positiveModulo } from "../../math/internal/positiveModulo";

/*
 * Seconds into a clip's stride cycle at `localTime`, or `null` when the clip
 * states no cycle to resume.
 *
 * A carried `gaitCycle` is authoritative: it is how a non-looping composite,
 * such as the film ladder's arranged performance, still knows its stride phase,
 * and the answer is `(phaseAt + localTime) mod period`. A cycle with a
 * non-positive or non-finite period, or a non-finite `phaseAt`, answers `null`
 * rather than a `NaN` phase. Without a cycle, a looping clip answers `localTime
 * mod duration`, the wrap the motion sampler applies, and a one-shot clip or a
 * looping clip of non-positive duration answers `null`. The phase is in `[0,
 * period)` seconds. `resolveBeatEnd` and `resolveBeatOpening` store it as an
 * actor's `gaitPhase`, which the next beat resumes mid-stride from.
 * Parameter clip: The validated clip the actor plays.
 * Parameter localTime: Clip-local seconds at the instant being resumed from.
 * Returns: The phase in seconds, or `null` when there is no cycle.
 */
export function gaitPhaseOf(
  clip: IAutoMovieMotion,
  localTime: number,
): number | null {
  const cycle: IAutoMovieGaitCycle | null = clip.gaitCycle ?? null;
  if (cycle !== null) {
    if (cycle.period <= 0) return null;
    return addPositiveModulo(cycle.phaseAt, localTime, cycle.period);
  }
  if (!clip.loop || clip.duration <= 0) return null;
  return positiveModulo(localTime, clip.duration);
}
