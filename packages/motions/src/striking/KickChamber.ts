import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../posture/internal/poseBones";

/**
 * A kick's chamber: the contact's own leg with the knee folded. The thigh
 * already points where the contact needs it, inside the hip's range of motion
 * because the contact pose was fitted, so folding only the knee gives a chamber
 * the leg can hold and from which the extension is the knee's opening alone, as
 * the kick is coached (kickboxing research).
 */
export namespace KickChamber {
  /** The chambered leg's actual knee, ankle and foot orientation. */
  export interface IKey {
    /** The knee joint, world metres. */
    knee: IAutoMovieVector3;

    /** The ankle joint, world metres. */
    ankle: IAutoMovieVector3;

    /** The foot's world rotation from its rest. */
    rotation: IAutoMovieQuaternion;
  }

  /**
   * Fold the knee of a fitted contact pose.
   *
   * @param body The body.
   * @param side The kicking side.
   * @param pose The fitted pose at contact.
   * @param flexion The chamber's knee flexion, degrees.
   * @returns The chambered knee, ankle and foot rotation, by forward
   *   kinematics.
   */
  export function fold(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    pose: IAutoMoviePose,
    flexion: number,
  ): IKey {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      {
        ...pose,
        joints: pose.joints.map(
          (j: IAutoMovieJointPose): IAutoMovieJointPose =>
            j.bone === `${side}LowerLeg` ? { ...j, flexion } : j,
        ),
      },
      undefined,
      OUTPUTS[side],
    );
    const foot: IAutoMovieResolvedBone = bones.get(
      `${side}Foot` as AutoMovieHumanoidBone,
    )!;
    return {
      knee: bones.get(`${side}LowerLeg` as AutoMovieHumanoidBone)!
        .worldPosition,
      ankle: foot.worldPosition,
      rotation: foot.worldRotation,
    };
  }
}

/** The only two FK records consumed by a folded chamber key. */
const OUTPUTS: Readonly<
  Record<AutoMovieHumanSide, ReadonlySet<AutoMovieHumanoidBone>>
> = {
  left: new Set<AutoMovieHumanoidBone>(["leftLowerLeg", "leftFoot"]),
  right: new Set<AutoMovieHumanoidBone>(["rightLowerLeg", "rightFoot"]),
};
