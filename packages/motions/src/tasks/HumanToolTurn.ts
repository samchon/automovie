import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Prepare one private work axis while reading the original live wrist orbit.
 *
 * @param pose The original work grip and hand rotation, read at every query.
 * @param axis The private arithmetic world axis, unchanged through this reader.
 * @param about The original world-metre pivot, whose coordinates remain live.
 * @returns A fresh original world grip/rotation for every actual degree angle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes the privately computed fixed axis from borrowed live work/pivot coordinates, actual degree input, lazy axis preparation and fresh world-metre/quaternion output.
 * @evidence contracts/development/implementation.md#principled-implementation Every query retains pivot+rotate(axisAngle,grip-pivot) and turn-times-work rotation. Only the private arithmetic axis's normalization prerequisites are shared; borrowed pivot/pose values are re-read normally.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The canonical lazy axis-angle producer feeds one original rigid point and attitude body; useTool's actual hammer/screwdriver branches still own their angle laws.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every actual axis-angle precedes the original live offset subtraction. Zero/nonfinite axes retain canonical behavior; no borrowed orbit snapshot, zero-orbit shortcut, profile/contact change or extra quaternion normalization is introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms One private fixed axis length serves Q turns. Every query retains the original live subtraction, angle trigonometry, vector rotation/addition and quaternion multiplication with constant fresh output storage. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work useTool constructs its left/forward axes as private arithmetic vectors never exposed to callbacks. That actual ownership proves only axis reuse; it does not infer borrowed aim points or pose graphs immutable, and no output/fit is cached.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns one private axis reader and its original live work/pivot references until release. Every query releases its offset scratch and returns fresh grip/rotation records without body/context, FK loan, angle history or external handle.
 */
export function HumanToolTurn(
  pose: { grip: IAutoMovieVector3; rotation: IAutoMovieQuaternion },
  axis: IAutoMovieVector3,
  about: IAutoMovieVector3,
): (degrees: number) => { grip: IAutoMovieVector3; rotation: IAutoMovieQuaternion } {
  const turning: ReturnType<typeof Quaternion.prepareAxisAngle> = Quaternion.prepareAxisAngle(axis);
  return (degrees: number): { grip: IAutoMovieVector3; rotation: IAutoMovieQuaternion } => {
    const turn: IAutoMovieQuaternion = turning(degrees);
    const orbit: IAutoMovieVector3 = Vector3.subtract(pose.grip, about);
    return {
      grip: Vector3.add(about, Quaternion.rotateVector(turn, orbit)),
      rotation: Quaternion.multiply(turn, pose.rotation),
    };
  };
}
