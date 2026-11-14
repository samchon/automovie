import type { IHumanBody } from "../body/IHumanBody";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import type { AutoMovieMotionHumanArmCarry } from "./AutoMovieMotionHumanArmCarry";

/**
 * The goal's end of an arm's carry inside one of its stretches
 * (`AutoMovieMotionHumanArm.ICarry.stretch`), read off fits at fixed seconds
 * instead of a fit at each second.
 *
 * A goal fitted afresh at each second may choose between two near-equal arms
 * differently from one second to the next, and the arm shown steps between
 * them: a wiping hand's arm turned its upper arm 3.7 degrees and moved its
 * wrist 17.6 mm within a 480th of a second of its way back. Fits at fixed
 * seconds are constants of the carry, so the goal's end is a continuous
 * function of time.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read instead of what, the measured defect it answers and why fixed seconds answer it.
 * @evidence contracts/development/design.md#principled-representation The goal's end of a carry as a piecewise blend of its fits at the ends of equal parts of the stretch's time.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The number of parts and the one reading; the fit itself is the caller's, so this owner keys and blends only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No fit is edited or remembered; every key is the caller's fit at its second.
 */
export namespace AutoMovieMotionHumanArmKeyed {
  /** The equal parts of a carry's stretch at whose ends its goal is fitted (provisional: twentieths, each about a frame of film of a 0.7 s carry). */
  export const KEYS: number = 20;

  /**
   * The goal's end of a carry at a second inside its stretch, as joints: the
   * goal fitted at the ends of the `KEYS` equal parts of the stretch's time
   * around the second, and carried between the two fits in proportion
   * (`blendHumanJoint`). At a key it is that key's fit, so the arrival is the
   * goal's own fit.
   *
   * @param body The body.
   * @param posture The posture so far at the second.
   * @param side The arm.
   * @param fit The arm's angles the goal at a second is fitted to.
   * @param stretch The held end's and the arrival's seconds.
   * @param seconds The second, inside the stretch.
   * @returns The posture with the arm written as joints and its goal removed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the keys, the proportion and what holds at a key.
   * @evidence contracts/development/implementation.md#principled-implementation Fits read at fixed seconds do not depend on the second they are read for, so two neighbouring seconds read two neighbouring points of one piecewise blend of fits; a ball joint is blended as a rotation and the others angle by angle (`blendHumanJoint`), as the carry blends its ends.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The two keys around the second, their two fits and one proportion per joint.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Each key is the caller's fit at its second, never an edited arm; nothing is remembered between seconds.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two fits (one at a key), in place of the one fit of the second itself.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the caller's fit and `blendHumanJoint`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function at(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    fit: (seconds: number) => AutoMovieMotionHumanArmCarry.IAngles,
    stretch: readonly [number, number],
    seconds: number,
  ): IHumanPosture {
    const [held, arrived] = stretch;
    const part: number = Math.min(
      KEYS,
      Math.max(0, ((seconds - held) / (arrived - held)) * KEYS),
    );
    const before: number = Math.min(KEYS - 1, Math.floor(part));
    const share: number = part - before;
    const key = (index: number): AutoMovieMotionHumanArmCarry.IAngles =>
      fit(held + ((arrived - held) * index) / KEYS);
    const a: AutoMovieMotionHumanArmCarry.IAngles = key(before);
    const b: AutoMovieMotionHumanArmCarry.IAngles =
      share === 0 ? a : key(before + 1);
    const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
    delete limbs[`${side}Arm`];
    return {
      ...posture,
      joints: {
        ...posture.joints,
        [`${side}UpperArm`]: blendHumanJoint(
          body,
          `${side}UpperArm`,
          a.upper,
          b.upper,
          share,
        ),
        [`${side}LowerArm`]: blendHumanJoint(
          body,
          `${side}LowerArm`,
          a.lower,
          b.lower,
          share,
        ),
        [`${side}Hand`]: blendHumanJoint(
          body,
          `${side}Hand`,
          a.hand,
          b.hand,
          share,
        ),
      },
      limbs,
    };
  }
}
