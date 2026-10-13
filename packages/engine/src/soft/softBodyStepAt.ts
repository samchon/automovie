import { IAutoMovieSoftBodyDomain } from "@automovie/interface";
/** Convert finite shot seconds to a nonnegative absolute step, or null for nonfinite time. A fixed 1e-9 step-space allowance handles near-boundary floating rounding; the caller admits positive finite clock spacing and checks the step budget.
 *
 * @evidence contracts/common.md#principled-implementation Finite seconds are floored after negative time is clamped to zero and the declared allowance is added. Very large finite time/very small spacing can yield an unrepresentable step; null distinguishes nonfinite time only.
 * @evidence contracts/common.md#clear-and-simple-design Sampling and furnishing lowering share this quantizer while separately choosing throwing or reported budget refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The boundary allowance is the existing fixed-clock policy; it is not an adaptive timestep or an invented history before rest.
 * @evidence contracts/common.md#meaningful-documentation States units, allowance, null meaning and the separate budget/clock premise.
 * @evidence contracts/performance.md#efficient-algorithms A finite check, clamp, division and floor take constant time and space.
 * @evidence contracts/performance.md#reuse-equivalent-work One quantizer serves both callers; no table of seconds or prior-frame cursor is needed for an absolute calculation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only number or null transfers; no input record, clock handle or playback state is retained.
 *
 * @author Samchon
 */
export const softBodyStepAt: (domain: IAutoMovieSoftBodyDomain, time: number) => number | null = (
  domain: IAutoMovieSoftBodyDomain,
  time: number,
): number | null => {
  if (!Number.isFinite(time)) return null;
  const clamped: number = time > 0 ? time : 0;
  return Math.floor(clamped / domain.solver.fixedStepSeconds + 1e-9);
};
