import type {
  AutoMovieHumanSide,
  IAutoMovieBodyMeasure,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { MartialArtStanceForms } from "../MartialArtStanceForms";

/**
 * A held guard fist's site from its shoulder joint, in the trunk's heading
 * frame (+X left, +Z ahead): the guard's inward, upward and forward shares in
 * shoulder half widths, upper-arm lengths and whole-arm lengths, the fist
 * standing at least its own depth, a forearm diameter, clear of the chest's
 * front, which lies half the chest's depth ahead of the shoulder joints.
 *
 * @param held The guard's site for this hand.
 * @param side The hand.
 * @param measure The body's measures.
 * @returns The offset from the shoulder joint, metres.
 */
export function martialArtGuardSite(
  held: MartialArtStanceForms.IGuardSite,
  side: AutoMovieHumanSide,
  measure: Pick<
    IAutoMovieBodyMeasure,
    | "shoulderHalfWidth"
    | "upperArm"
    | "forearm"
    | "chestDepth"
    | "forearmRadius"
  >,
): IAutoMovieVector3 {
  const outward: number = side === "left" ? 1 : -1;
  return {
    x: -outward * held.inward * measure.shoulderHalfWidth,
    y: held.up * measure.upperArm,
    z: Math.max(
      held.forward * (measure.upperArm + measure.forearm),
      measure.chestDepth / 2 + 2 * measure.forearmRadius,
    ),
  };
}
