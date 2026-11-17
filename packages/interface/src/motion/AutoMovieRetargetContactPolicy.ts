/**
 * How a retarget treats the contacts the source clip made.
 *
 * "pin-source-contacts" fits limbs to source contacts mapped through rootScale, subject to target reach and ROM; "carry-joint-angles" copies angles and can slide contacts when rig proportions differ.
 *
 * @evidence contracts/development/design.md#principled-representation Records whether retargetHumanoidMotion ran contact correction or retained root-scaled clinical angles, operations that differ when rig proportions change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two outcome labels sit in characterization while the contacts input controls whether correction runs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Contact mode follows authored enabled policy for every rig, without source asset identity changing the recorded result.
 * @evidence contracts/development/common.md#meaningful-documentation Explains source-contact scaling and the sliding limitation of unchanged angles under proportion changes.
 */
export type AutoMovieRetargetContactPolicy =
  | "pin-source-contacts"
  | "carry-joint-angles";
