import type { AutoMovieHumanoidRegion } from "@automovie/interface";

/**
 * The region of the partner a staged kick is thrown at. The staged kicker
 * stands in the orthodox guard facing a partner who faces back, so the rear
 * leg is the right one and the lead leg the left.
 *
 * A round kick swings its shin across the line from its own side and lands
 * on the flank that side faces, at the floating ribs between the hip and
 * the rib cage ("the soft area between the hip and the ribcage where the
 * floating rib sits", Evolve MMA, "Here's How To Land A Liver Shot KO In
 * Muay Thai"): the rear (right) leg on the partner's left ribs, the lead
 * (left) leg on the partner's right ribs, the liver side.
 *
 * A push kick is the teep: a straight kick along the centreline, the knee
 * lifted high, the hips driven forward and the ball of the foot driven into
 * the opponent's body, "usually the stomach, chest, or hips", the stomach
 * the most common target (Evolve MMA, "The Complete Guide To The Muay Thai
 * Push Kick"; LowKick MMA, "Muay Thai Push Kick – Teep"). So it is staged
 * at the abdomen with either leg, the midline the guard's elbows leave open
 * below the gloves.
 *
 * @param technique The row's technique; the round kick when absent.
 * @param leg The row's leg; the rear when absent.
 * @returns The region of the partner the kick is aimed at.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staged stance, the rule for each technique and leg with its sources, and the region each case gets.
 * @evidence contracts/development/implementation.md#principled-implementation A round kick lands on the flank its own side faces on a facing partner and a teep on the midline, as the sources describe them; the stage and the signature's reading share this one rule.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two conditions, one per technique.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every row is staged; each technique's target is the one the sources give it, not one a measured stop suggested.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the kick stage and the kick signature's reading, so the target is decided once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function motionKickTarget(
  technique: string | undefined,
  leg: string | undefined,
): AutoMovieHumanoidRegion {
  if ((technique ?? "round") === "push") return "abdomen";
  return leg === "lead" ? "ribsRight" : "ribsLeft";
}
