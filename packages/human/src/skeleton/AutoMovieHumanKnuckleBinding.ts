import type { IAutoMovieHumanBindingLimb } from "./IAutoMovieHumanBindingLimb";
import type { IAutoMovieHumanBindingRegion } from "./IAutoMovieHumanBindingRegion";
import { AutoMovieHumanLimbCapsule } from "./AutoMovieHumanLimbCapsule";

/**
 * The knuckle region: a finger's metacarpophalangeal joint, where it leaves
 * the palm, and its band against its neighbours.
 *
 * Siblings that share the hand's plane are told apart by capsule. The band
 * between two digits is a difference of two distances, so it is never wider
 * than the digit's own radius, which would draw a neighbour's skin onto it,
 * and never narrower than {@link FINGER_CONTEST} radii, or the digits' turn
 * would cross a few millimetres of skin. The thumb's metacarpal is told from
 * its neighbours the same way ({@link AutoMovieHumanThumbCmcBinding}).
 */
export namespace AutoMovieHumanKnuckleBinding {
  /** Least half of a digit's comparison with its neighbours, in the digit's radii (convention). */
  export const FINGER_CONTEST: number = 0.8;

  /** The region of the four fingers' `Proximal` joints. */
  export const region: IAutoMovieHumanBindingRegion = {
    name: "knuckle",
    bones: /(Index|Middle|Ring|Little)Proximal$/,
    digit: true,
  };

  /**
   * Set a digit against its neighbours.
   *
   * @param digit The digit's first limb; its rivals, own capsules and contest are set.
   * @param hand The hand limb whose children the digits are.
   * @param more Limbs the digit is told from beyond its siblings.
   */
  export function attach(
    digit: IAutoMovieHumanBindingLimb,
    hand: IAutoMovieHumanBindingLimb,
    more: readonly IAutoMovieHumanBindingLimb[],
  ): void {
    digit.rivals = [
      ...hand.kids
        .filter((k: IAutoMovieHumanBindingLimb): boolean => k !== digit)
        .flatMap(AutoMovieHumanLimbCapsule.family),
      ...more,
    ];
    digit.own = AutoMovieHumanLimbCapsule.family(digit);
    digit.contest = FINGER_CONTEST * digit.near;
  }

  /**
   * Widen a digit's comparison to its knuckle's turn.
   *
   * @param digit The digit.
   * @param half The knuckle's ramp half, metres; zero when it has none.
   */
  export function widen(
    digit: IAutoMovieHumanBindingLimb,
    half: number,
  ): void {
    digit.contest = Math.max(digit.contest, Math.min(digit.near, 2 * half));
  }
}
