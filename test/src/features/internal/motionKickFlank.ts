/**
 * The region of the trunk a staged kick is thrown at. The staged kicker stands in the
 * orthodox guard facing a partner who faces back, so the rear leg is the
 * right one and the lead leg the left. A round kick's shin arrives across
 * the line from its own side and lands on the flank that side faces: the
 * right leg on the partner's left ribs, the left leg on the right ribs (the
 * law refuses the other flank, `KickFacing`). A push kick travels straight
 * along the line and is staged at the abdomen with either leg: the partner's
 * guard holds an upper arm before each flank's ribs (measured: the lead push
 * kick aimed at the left ribs was stopped on the lead upper arm, 357 mm
 * from them), and the midline between the elbows is what it leaves open to
 * a straight kick.
 *
 * @param technique The row's technique; the round kick when absent.
 * @param leg The row's leg; the technique's default when absent (the rear for a round kick).
 * @returns The region of the partner the kick is aimed at.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staged stance, the rule, each case's region and the measured reason for the push kick's.
 * @evidence contracts/development/implementation.md#principled-implementation The flank a round kick can land on is the one its own side faces on a facing partner; the stage and the signature's reading share this one rule.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The staging keeps every row; only the lead round kick's flank differs, because the flank it was staged at before is one no lead round kick reaches.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the kick stage and the kick signature's reading.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function motionKickFlank(
  technique: string | undefined,
  leg: string | undefined,
): "ribsLeft" | "ribsRight" | "abdomen" {
  if ((technique ?? "round") !== "round") return "abdomen";
  return leg === "lead" ? "ribsRight" : "ribsLeft";
}
