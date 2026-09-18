import { IAutoMovieMotion } from "@automovie/interface";
import { addPositiveModulo } from "../math/addPositiveModulo";

/**
 * Seconds into a looping clip's cycle at `localTime`, or `null` when the clip
 * does not loop (a one-shot clip has no cycle to resume).
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-phases gaitPhaseOf preserves planted contact phases: Seconds into a looping clip's cycle at `localTime`, or `null` when the clip does not loop (a one-shot clip has no cycle to resume).
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support gaitPhaseOf realizes contact-phase support: Seconds into a looping clip's cycle at `localTime`, or `null` when the clip does not loop (a one-shot clip has no cycle to resume).
 */
export const gaitPhaseOf = (
  clip: IAutoMovieMotion,
  localTime: number,
): number | null => {
  // A carried gait cycle is authoritative: it is how a NON-looping composite
  // (the film ladder's arranged performance) still knows its stride phase.
  // Without it, compiled shots always answered null and the mid-stride resume
  // never fired in the real ladder. Degenerate meta yields null, matching the
  // degenerate-duration rule below.
  const cycle = clip.gaitCycle ?? null;
  if (cycle !== null) {
    if (!Number.isFinite(cycle.period) || cycle.period <= 0) return null;
    if (!Number.isFinite(cycle.phaseAt)) return null;
    return addPositiveModulo(cycle.phaseAt, localTime, cycle.period);
  }
  if (!clip.loop) return null;
  if (clip.duration <= 0) return null;
  return wrapTime(localTime, clip.duration);
};
