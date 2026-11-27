import type { IAutoMovieSwivelNear } from "@automovie/interface";

import { AutoMovieEngineHingedArmSwivel } from "../AutoMovieEngineHingedArmSwivel";
import { refineHingedSwivel } from "./refineHingedSwivel";

/*
 * The swivel of a hinged chain continued from the seed of a nearby fit
 * (`IAutoMovieSwivelNear`), on the seed's branch: a closed-form candidate
 * inside the start's bracket when one answers, else the start refined within
 * one step either way by the golden-section search to the seed's tolerance. The
 * start is the seed, or where the caller knows the swivels at which its
 * requested term can be met as intervals in closed form, the swivel the caller
 * continues the seed's admissible interval to (the seed itself while the
 * interval holds it): a target that moved that interval past the seed is
 * followed there in one call rather than one step a call, and the caller gives
 * no start where the interval vanished. A start whose result is not legal and
 * met competes with the seed's own continuation and is kept only when ranked
 * strictly ahead of it.
 *
 * Where the caller knows in closed form the swivels at which a requested term
 * is met (`closed`: an end joint's immobile-axis roots, or the admitted swivel
 * nearest a pole), one of them lying less than a step from the seed is the very
 * point the refinement converges toward: the best of those is scored, and it is
 * the answer when it is legal and `met` accepts it, at one score a candidate
 * instead of the refinement's two and one more a pass. A candidate is taken in
 * the seed's own turn, so the returned swivel continues the seed's. Otherwise,
 * and without closed candidates, the refinement runs as before.
 *
 * If dividing a positive subnormal tolerance by the initial bracket width
 * underflows, the difference of logarithms keeps the mathematically finite
 * refinement count finite; ordinary ratios retain their original expression.
 * Parameter props: The branch's scorer and ordering, the seed, the branch's
 * closed-form candidates when the caller has them, and the acceptance of a
 * candidate.
 * Returns: The chosen candidate.
 * When the seed's tolerance is not positive and finite.
 */
export function hingedSwivelNear<T extends { overshoot: number }>(props: {
  /*
   * The seed's branch's scored candidate at a swivel, degrees.
   */
  probe: (angle: number) => T;

  /*
   * Whether the first candidate is strictly ahead of the second.
   */
  better: (a: T, b: T) => boolean;

  /*
   * The seed to continue.
   */
  near: IAutoMovieSwivelNear;

  /*
   * The swivel the search is centred on, degrees in the seed's own turn: the
   * admissible swivel nearest the seed where the caller knows it; absent, the
   * seed's.
   */
  start?: number;

  /*
   * The branch's closed-form candidate swivels, degrees in any turn; absent or
   * null when the caller has none.
   */
  closed?: readonly number[] | null;

  /*
   * Whether a legal closed-form candidate meets every requested term; absent,
   * legality alone decides.
   */
  met?: (candidate: T) => boolean;
}): T {
  const near: IAutoMovieSwivelNear = props.near;
  if (!(near.tolerance > 0))
    throw new Error("A continued fit needs a positive finite tolerance");

  const ratio: number = near.tolerance / (2 * STEP);
  const contraction: number =
    ratio === 0
      ? Math.log(near.tolerance) - Math.log(2 * STEP)
      : Math.log(ratio);
  const passes: number = Math.max(
    0,
    Math.ceil(contraction / Math.log(AutoMovieEngineHingedArmSwivel.GOLDEN)),
  );

  // The closed-form candidates less than a step from a centre, each in the
  // seed's own turn: the best of them answers when legal and met; otherwise
  // the centre is refined.
  const answered = (candidate: T): boolean =>
    candidate.overshoot === 0 &&
    (props.met === undefined || props.met(candidate));
  const continueFrom = (centre: number): T => {
    let best: T | null = null;
    for (const angle of props.closed ?? []) {
      const turn: number = angle - centre;
      const delta: number = turn - 360 * Math.round(turn / 360);
      if (!(Math.abs(delta) < STEP)) continue;
      const candidate: T = props.probe(delta === 0 ? centre : centre + delta);
      if (best === null || props.better(candidate, best)) best = candidate;
    }
    if (best !== null && answered(best)) return best;
    return refineHingedSwivel(props.probe, props.better, centre, passes);
  };
  if (props.start === undefined || props.start === near.swivel)
    return continueFrom(near.swivel);

  // The admissible start answers when its result is legal and met; else the
  // seed's own continuation is the other local answer, and the start's is
  // taken only when the score ranks it strictly ahead, so a start that does
  // not help leaves the fit as continuing its seed would have.
  const moved: T = continueFrom(props.start);
  if (answered(moved)) return moved;
  const stayed: T = continueFrom(near.swivel);
  return props.better(moved, stayed) ? moved : stayed;
}

/*
 * The articulation's swivel step, degrees (`AutoMovieEngineHingedArmSwivel.STEP`).
 */
const STEP: number = AutoMovieEngineHingedArmSwivel.STEP;
