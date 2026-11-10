import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { poseBones } from "../posture/poseBones";

/**
 * A kick's chamber: the contact's own leg with the knee folded. The thigh
 * already points where the contact needs it, inside the hip's range of
 * motion because the contact pose was fitted, so folding only the knee gives
 * a chamber the leg can hold and from which the extension is the knee's
 * opening alone, as the kick is coached (kickboxing research of #3201).
 */
export namespace KickChamber {
  /** A chambered leg. */
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
   * @returns The chambered knee, ankle and foot rotation, by forward kinematics.
   */
  export function fold(
    body: IHumanBody,
    side: "left" | "right",
    pose: IAutoMoviePose,
    flexion: number,
  ): IKey {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, {
        ...pose,
        joints: pose.joints.map(
          (j: IAutoMovieJointPose): IAutoMovieJointPose =>
            j.bone === `${side}LowerLeg` ? { ...j, flexion } : j,
        ),
      });
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
