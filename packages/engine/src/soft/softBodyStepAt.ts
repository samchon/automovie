import type { IAutoMovieSoftBodyDomain } from "@automovie/interface";

/**
 * The absolute step one shot second snaps down to, or `null` when that second
 * is not a real number.
 *
 * The snap is what makes playback frame-rate independent: captures at 24 and 30
 * fps read the same integrated state whenever they land inside the same step,
 * instead of each integrating a different number of times. A second before the
 * clock starts snaps to `0`, since a panel has no history earlier than its own
 * rest configuration.
 *
 * Stated apart from {@link sampleSoftBody} so a caller that must report rather
 * than throw — a lowering answering for a whole shot — can ask which step a
 * second wants before asking whether the declared budget reaches it.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Maps shot time to the soft solver's absolute fixed-step state.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Selects the exact transition boundary without advancing hidden state.
 * @author Samchon
 */
export const softBodyStepAt = (
  domain: IAutoMovieSoftBodyDomain,
  time: number,
): number | null => {
  if (!Number.isFinite(time)) return null;
  const clamped = time > 0 ? time : 0;
  return Math.floor(clamped / domain.solver.fixedStepSeconds + 1e-9);
};
