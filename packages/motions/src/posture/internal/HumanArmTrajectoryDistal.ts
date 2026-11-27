import {
  AutoMovieEngineHumanoidRestFrame,
  AutoMovieEngineQuaternion,
  AutoMovieEngineMotionDistalTwist,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieQuaternion,
} from "@automovie/interface";

/*
 * Project the desired world hand rotation across native forearm pronation and
 * wrist axes, writing their clinical coordinates into the trial arm.
 */
export function HumanArmTrajectoryDistal(
  setup: IAutoMovieMotionHumanArmGeometry.ISetup,
  upper: IAutoMovieQuaternion,
  hand: IAutoMovieQuaternion,
  c: number[],
): void {
  // Pronation belongs to the forearm. Assigning all the axial turn
  // to the wrist would reject even the first small approach step.
  const split: ReturnType<typeof AutoMovieEngineMotionDistalTwist.withProjection> =
    AutoMovieEngineMotionDistalTwist.withProjection({
      joint: {
        bone: setup.bones.lower,
        flexion: c[3]!,
        abduction: c[4]!,
        twist: c[5]!,
      },
      effector: {
        bone: setup.bones.hand,
        flexion: c[6]!,
        abduction: c[7]!,
        twist: c[8]!,
      },
      above: AutoMovieEngineQuaternion.multiply(upper, setup.rest.lower.rotation),
      lowerBasis: setup.basis(setup.bones.lower, "contact transport forearm"),
      lowerFrame: AutoMovieEngineHumanoidRestFrame[setup.bones.lower],
      effectorRest: setup.rest.hand.rotation,
      effectorBasis: setup.basis(setup.bones.hand, "contact transport wrist"),
      effectorFrame: AutoMovieEngineHumanoidRestFrame[setup.bones.hand],
      rotation: hand,
      skeleton: setup.body.skeleton,
    });
  // A null clinical axis contributes the rest rotation in
  // AutoMovieEngineKinematicsJointRotation.jointToQuaternionOnBasis. The arm chart stores clinical degrees,
  // so its representation of that same rotation is the frame neutral.
  c[5] =
    split.joint.twist ??
    AutoMovieEngineHumanoidRestFrame[setup.bones.lower]?.twist?.neutral ??
    0;
  c[6] =
    split.projection.joint.flexion ??
    AutoMovieEngineHumanoidRestFrame[setup.bones.hand]?.flexion?.neutral ??
    0;
  c[7] =
    split.projection.joint.abduction ??
    AutoMovieEngineHumanoidRestFrame[setup.bones.hand]?.abduction?.neutral ??
    0;
  c[8] =
    split.projection.joint.twist ??
    AutoMovieEngineHumanoidRestFrame[setup.bones.hand]?.twist?.neutral ??
    0;
}
