import type {
  AutoMovieVector3Tuple,
  IAutoMovieArcLengthJet,
  IAutoMovieHumanArmPrior,
  IAutoMovieHumanHandHeel,
} from "@automovie/interface";

import { AutoMovieHumanSeam } from "../lofting/AutoMovieHumanSeam";
import { AutoMovieHumanArmPrior } from "./AutoMovieHumanArmPrior";
import { AutoMovieHumanHandForm } from "./AutoMovieHumanHandForm";
import { AutoMovieHumanHandStar } from "./AutoMovieHumanHandStar";
import { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";

const { smooth, smoother }: typeof AutoMovieHumanHandVector =
  AutoMovieHumanHandVector;
const { omega }: typeof AutoMovieHumanHandForm = AutoMovieHumanHandForm;
const { wholeSkin }: typeof AutoMovieHumanHandStar = AutoMovieHumanHandStar;

/**
 * The wrist heel: the hand's skin from the wrist crease to the thumb's
 * branch, where the forearm's bone tube hands over to the hand, its own
 * piece with the carpus's axis (the hand's own frame, along the third
 * metacarpal's direction) and not the forearm's.
 *
 * At each station `a` of the hand's own axis (the crease at `PRIOR.hand.crease`,
 * the branch at `PRIOR.hand.branch`) and phase `t`, the heel's point is the
 * bone tube's point there (`bone`, the arm's cut of its tube by the plane
 * square to the hand: the arm owns the tube and publishes where it ends,
 * `AutoMovieHumanWristSpan.end`) drawn to the hand's skin by the quintic
 * smooth step `v` of the way from the crease to the branch:
 *
 * ```text
 * p(a, t) = bone(a, t) + v (skin(a, t) - bone(a, t))
 * v = smoother((a - crease) / (branch - crease))
 * ```
 *
 * where `skin` is the hand form's heel star (`wholeSkin`) handing over to the
 * palm's run and the thumb's opening across the thenar's reach. At the crease
 * `v` is 0, with its first and second derivatives, so the heel there is the
 * bone tube's own section and the seam with the forearm is G2 by construction:
 * the heel publishes the crease layer's jet ({@link creaseJet}) by arclength
 * and the forearm copies it (`AutoMovieHumanSeam`, J1). At the branch `v` is 1
 * with zero slope and curvature, so the palm's and thenar's chains inherit the
 * hand's skin untouched.
 */
export namespace AutoMovieHumanHandHeel {
  /*
   * Step of the phase for the crease jet's derivatives, radians.
   */
  const PHASE_STEP: number = 1e-3;

  /**
   * The heel's point at a station and phase.
   *
   * @param input The heel's inputs.
   * @param a Station along the hand's axis, mm of the form, from the crease to the branch.
   * @param t The arm section's phase, radians.
   */
  export function point(
    input: IAutoMovieHumanHandHeel.IInput,
    a: number,
    t: number,
  ): AutoMovieVector3Tuple {
    const prior: IAutoMovieHumanArmPrior.IHandPrior =
      AutoMovieHumanArmPrior.PRIOR.hand;
    const whole: AutoMovieVector3Tuple = wholeSkin(
      input.form.whole,
      a,
      omega() - t,
    );
    const closing: number = smooth(
      (a - prior.branch + prior.thenar.reach) / prior.thenar.reach,
    );
    const opening: AutoMovieVector3Tuple = input.form.opening(a, t);
    const skin: AutoMovieVector3Tuple = input.map([
      a,
      whole[1] + closing * (opening[1] - whole[1]),
      whole[2] + closing * (opening[2] - whole[2]),
    ]);
    const v: number = smoother(
      (a - prior.crease) / (prior.branch - prior.crease),
    );
    if (v === 1) return skin;

    const bone: AutoMovieVector3Tuple = input.bone(a, t);
    return [
      bone[0] + v * (skin[0] - bone[0]),
      bone[1] + v * (skin[1] - bone[1]),
      bone[2] + v * (skin[2] - bone[2]),
    ];
  }

  /**
   * The jet of the crease layer's section at a phase, by arclength: the point,
   * unit tangent and curvature vector the forearm copies so its last section
   * meets the heel G2.
   *
   * @param input The heel's inputs.
   * @param t The arm section's phase, radians.
   */
  export function creaseJet(
    input: IAutoMovieHumanHandHeel.IInput,
    t: number,
  ): IAutoMovieArcLengthJet {
    const crease: number = AutoMovieHumanArmPrior.PRIOR.hand.crease;
    const before: AutoMovieVector3Tuple = point(input, crease, t - PHASE_STEP);
    const at: AutoMovieVector3Tuple = point(input, crease, t);
    const after: AutoMovieVector3Tuple = point(input, crease, t + PHASE_STEP);
    const d1: number[] = at.map(
      (_: number, k: number): number =>
        (after[k]! - before[k]!) / (2 * PHASE_STEP),
    );
    const d2: number[] = at.map(
      (v: number, k: number): number =>
        (before[k]! - 2 * v + after[k]!) / (PHASE_STEP * PHASE_STEP),
    );

    return AutoMovieHumanSeam.publish(at, d1, d2);
  }
}
