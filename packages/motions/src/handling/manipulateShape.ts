import type { AutoMovieHumanoidBone, IAutoMovieMotionHumanHand } from "@automovie/interface";

import { HumanHand } from "../posture/HumanHand";

/**
 * The hand's shape while one digit presses in a keyed contact sequence
 * (`manipulate`): that digit straight, as the flat hand holds it, for its
 * own inverse kinematics to take down to its key, and every other digit
 * curled as in the fist, clear of the keys, as typing's pointing
 * hand curls all but the forefinger (`typeText`). The plan places the hand
 * with it and the fingering reads the pressing digit's tip in it.
 *
 * @param side The hand.
 * @param digit The pressing digit, as `manipulate.Finger` names it.
 * @returns Angles for every digit segment of that hand.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two parts of the shape, why each, and who reads it.
 * @evidence contracts/development/implementation.md#principled-implementation The hand's own documented shapes (`HumanHand.shape`): the fist's curl for the idle digits and the flat hand's straight digit for the pressing one.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two shapes merged, the pressing digit's segments last.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No angle is written here: both come from the hand's shapes.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fifteen entries with no algorithm to choose.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
 */
export function manipulateShape(
  side: IAutoMovieMotionHumanHand.Side,
  digit: string,
): Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> {
  const own: string = `${side}${digit[0]!.toUpperCase()}${digit.slice(1)}`;
  const straight: Partial<
    Record<AutoMovieHumanoidBone, readonly [number, number, number]>
  > = HumanHand.shape(side, "flat");
  return {
    ...HumanHand.shape(side, "fist"),
    ...Object.fromEntries(
      Object.entries(straight).filter(([bone]: [string, unknown]): boolean =>
        bone.startsWith(own),
      ),
    ),
  };
}
