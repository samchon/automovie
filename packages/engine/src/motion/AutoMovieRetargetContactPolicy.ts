/**
 * How a retarget treats the contacts the source clip made.
 *
 * "pin-source-contacts" fits limbs to source contacts mapped through rootScale, subject to target reach and ROM; "carry-joint-angles" copies angles and can slide contacts when rig proportions differ.
 *
 * @evidence contracts/common.md#principled-implementation Records whether retargetHumanoidMotion ran contact correction or retained root-scaled clinical angles, operations that differ when rig proportions change.
 * @evidence contracts/common.md#clear-and-simple-design Two outcome labels sit in characterization while the contacts input controls whether correction runs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contact mode follows authored enabled policy for every rig, without source asset identity changing the recorded result.
 * @evidence contracts/common.md#meaningful-documentation Explains source-contact scaling and the sliding limitation of unchanged angles under proportion changes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms These result labels perform no forward or inverse kinematics; the selected pass owns that computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Recording contact policy shares no corrected keyframes between retarget requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The containing characterization owns a literal value, with no source-frame collection or solver resource attached.
 */
export type AutoMovieRetargetContactPolicy =
  | "pin-source-contacts"
  | "carry-joint-angles";
