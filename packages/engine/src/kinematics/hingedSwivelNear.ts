import type { IAutoMovieSwivelNear } from "@automovie/interface";

import { hingedArmSwivel } from "./hingedArmSwivel";
import { refineHingedSwivel } from "./refineHingedSwivel";

/** The articulation's swivel step, degrees (`hingedArmSwivel.STEP`). */
const STEP: number = hingedArmSwivel.STEP;

/**
 * The swivel of a hinged chain continued from the seed of a nearby fit
 * (`IAutoMovieSwivelNear`), on the seed's branch: a closed-form candidate
 * inside the start's bracket when one answers, else the start refined within
 * one step either way by the golden-section search to the seed's tolerance.
 * The start is the seed, or where the caller knows the swivels at which its
 * requested term can be met as intervals in closed form, the admissible
 * swivel nearest the seed (the seed itself when it is admissible): a target
 * that moved the admissible set past the seed is followed there in one call,
 * however far, rather than one step a call.
 *
 * Where the caller knows in closed form the swivels at which a requested
 * term is met (`closed`: an end joint's immobile-axis roots, or the
 * admitted swivel nearest a pole), one of them lying less than a step from
 * the seed is the very point the refinement converges toward: the best of
 * those is scored, and it is the answer when it is legal and `met` accepts
 * it, at one score a candidate instead of the refinement's two and one more
 * a pass. A candidate is taken in the seed's own turn, so the returned
 * swivel continues the seed's. Otherwise, and without closed candidates, the
 * refinement runs as before.
 *
 * If dividing a positive subnormal tolerance by the initial bracket width
 * underflows, the difference of logarithms keeps the mathematically finite
 * refinement count finite; ordinary ratios retain their original expression.
 *
 * @param props The branch's scorer and ordering, the seed, the branch's closed-form candidates when the caller has them, and the acceptance of a candidate.
 * @returns The chosen candidate.
 * @throws {Error} When the seed's tolerance is not positive and finite.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both paths, when the closed-form candidate answers, the turn it is taken in, the subnormal case and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Where a requested term is met only at isolated swivels, those are the admissible set near the seed too (the analytic swivel of Tolani, Goswami and Badler 2000), and the refinement of the same score converges on the one inside its bracket; the golden-section search (Kiefer 1953) remains for every other case. Where the term is met over intervals of swivels known in closed form, the point of that set nearest the seed is the seed or an interval end, the continuation's nearest admissible configuration, so the search is centred there with no cap on how far it lies.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The tolerance's admission, the closed-form candidates of the bracket, then the refinement.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A closed-form candidate answers only when the caller's own score finds it legal and its own acceptance finds the term met; anything less is refined exactly as before, with the original pass count.
 * @evidence contracts/development/implementation.md#efficient-algorithms One score per closed-form candidate of the bracket, at most a few, in place of two scores and one per pass; the refinement's count is unchanged when it runs. Unmeasured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure search of the caller's scorers.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds a few candidates until return.
 */
export function hingedSwivelNear<T extends { overshoot: number }>(props: {
  /** The seed's branch's scored candidate at a swivel, degrees. */
  probe: (angle: number) => T;

  /** Whether the first candidate is strictly ahead of the second. */
  better: (a: T, b: T) => boolean;

  /** The seed to continue. */
  near: IAutoMovieSwivelNear;

  /** The swivel the search is centred on, degrees in the seed's own turn: the admissible swivel nearest the seed where the caller knows it; absent, the seed's. */
  start?: number;

  /** The branch's closed-form candidate swivels, degrees in any turn; absent or null when the caller has none. */
  closed?: readonly number[] | null;

  /** Whether a legal closed-form candidate meets every requested term; absent, legality alone decides. */
  met?: (candidate: T) => boolean;
}): T {
  const near: IAutoMovieSwivelNear = props.near;
  if (!(near.tolerance > 0) || !Number.isFinite(near.tolerance))
    throw new Error("A continued fit needs a positive finite tolerance");

  // The closed-form candidates less than a step from the start, each in the
  // seed's own turn; the best of them answers when legal and met.
  const start: number = props.start ?? near.swivel;
  let best: T | null = null;
  for (const angle of props.closed ?? []) {
    const turn: number = angle - start;
    const delta: number = turn - 360 * Math.round(turn / 360);
    if (!(Math.abs(delta) < STEP)) continue;
    const candidate: T = props.probe(delta === 0 ? start : start + delta);
    if (best === null || props.better(candidate, best)) best = candidate;
  }
  if (best !== null && best.overshoot === 0 &&
    (props.met === undefined || props.met(best))) return best;
  const ratio: number = near.tolerance / (2 * STEP);
  const contraction: number = ratio === 0
    ? Math.log(near.tolerance) - Math.log(2 * STEP)
    : Math.log(ratio);
  return refineHingedSwivel(props.probe, props.better, start,
    Math.max(0, Math.ceil(contraction / Math.log(hingedArmSwivel.GOLDEN))));
}
