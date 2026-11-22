import { HUMANOID_REST_FRAME, Quaternion, solveDistalTwist } from "@automovie/engine";
import type { IAutoMovieMotionHumanArmGeometry, IAutoMovieQuaternion } from "@automovie/interface";

/**
 * Project the desired world hand rotation across native forearm pronation
 * and wrist axes, writing their clinical coordinates into the trial arm.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the rotation frame, the mutable trial coordinates and the native clinical domains.
 * @evidence contracts/development/implementation.md#principled-implementation The native distal twist projection divides the requested world rotation between the actual forearm and wrist, continuing the trial's own twist in its basin (Tolani, Goswami and Badler 2000), so the projection is continuous in the trial's coordinates.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One native projection writes the four returned angular coordinates.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the rig's neutral for absent wrist axes and retains the caller's independent actual FK check.
 * @evidence contracts/development/implementation.md#efficient-algorithms One projection per oriented candidate.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both analytic contact-circle and transport readers share the same projection owner.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Writes the caller's trial and retains nothing.
 */
export function HumanArmTrajectoryDistal(
  setup: IAutoMovieMotionHumanArmGeometry.ISetup,
  upper: IAutoMovieQuaternion,
  hand: IAutoMovieQuaternion,
  c: number[],
): void {
  // Pronation belongs to the forearm. Assigning all the axial turn
  // to the wrist would reject even the first small approach step.
  const split: ReturnType<typeof solveDistalTwist.withProjection> = solveDistalTwist.withProjection({
    joint: { bone: setup.bones.lower, flexion: c[3]!, abduction: c[4]!, twist: c[5]! },
    effector: { bone: setup.bones.hand, flexion: c[6]!, abduction: c[7]!, twist: c[8]! },
    above: Quaternion.multiply(upper, setup.rest.lower.rotation),
    lowerBasis: setup.basis(setup.bones.lower, "contact transport forearm"),
    lowerFrame: HUMANOID_REST_FRAME[setup.bones.lower],
    effectorRest: setup.rest.hand.rotation,
    effectorBasis: setup.basis(setup.bones.hand, "contact transport wrist"),
    effectorFrame: HUMANOID_REST_FRAME[setup.bones.hand],
    rotation: hand,
    skeleton: setup.body.skeleton,
    // The trial's own forearm twist is continued: the projection keeps its
    // basin, so it moves continuously with the trial rather than jumping
    // between the twist range's ends where the hand's rotation is beyond it.
    reference: c[5]!,
  });
  // A null clinical axis contributes the rest rotation in
  // jointToQuaternionOnBasis. The arm chart stores clinical degrees,
  // so its representation of that same rotation is the frame neutral.
  c[5] = split.joint.twist ?? HUMANOID_REST_FRAME[setup.bones.lower]?.twist?.neutral ?? 0;
  c[6] = split.projection.joint.flexion ?? HUMANOID_REST_FRAME[setup.bones.hand]?.flexion?.neutral ?? 0;
  c[7] = split.projection.joint.abduction ?? HUMANOID_REST_FRAME[setup.bones.hand]?.abduction?.neutral ?? 0;
  c[8] = split.projection.joint.twist ?? HUMANOID_REST_FRAME[setup.bones.hand]?.twist?.neutral ?? 0;
}
