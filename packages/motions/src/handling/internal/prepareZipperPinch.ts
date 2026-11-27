import { Quaternion, Vector3, clampPose } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanDigitFit } from "../../posture/HumanDigitFit";
import { HumanHand } from "../../posture/HumanHand";
import { HumanHandShape } from "../../posture/HumanHandShape";
import { poseBones } from "../../posture/internal/poseBones";

/**
 * A neutral-wrist seed for an opposed thumb and index, with wrist-relative
 * geometry.
 */
interface IAutoMovieZipperPinch {
  /** Clinical joint degrees for the complete hand at the fitted pinch. */
  joints: IAutoMovieMotionHumanPosture["joints"];
  /** The midpoint of the two tab faces relative to the neutral wrist, metres. */
  contact: IAutoMovieVector3;
  /** The neutral-wrist direction from the lower face to the upper face. */
  normal: IAutoMovieVector3;
}

/**
 * Pre-fit the thumb and index to opposite faces of a tab of the stated
 * thickness with the canonical digit solver. Move their common midpoint toward
 * their two achieved tips until both fit or the iteration ends. This is a seed
 * for the subsequent arm trajectory and world fingertip fits.
 */
export function prepareZipperPinch(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  thickness: number,
): IAutoMovieZipperPinch {
  const joints: IAutoMovieMotionHumanPosture["joints"] = HumanHandShape.emblem(
    side,
    "ok",
  );
  // A working pinch keeps the three idle fingers curled away from the tab.
  const closed: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
    side,
    "fist",
  );
  const thumb = `${side}Thumb` as const;
  const index = `${side}Index` as const;
  for (const bone of Object.keys(closed) as AutoMovieHumanoidBone[])
    if (!bone.startsWith(thumb) && !bone.startsWith(index))
      joints[bone] = closed[bone]!;

  let pose: IAutoMoviePose = clampPose(
    {
      skeleton: body.skeleton.id,
      root: null,
      joints: (Object.keys(joints) as AutoMovieHumanoidBone[]).map(
        (bone: AutoMovieHumanoidBone): IAutoMovieJointPose => {
          const [flexion, abduction, twist] = joints[bone]!;
          return { bone, flexion, abduction, twist };
        },
      ),
    },
    body.skeleton,
  );
  const frames: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    new Set<AutoMovieHumanoidBone>([
      `${side}Hand`,
      ...HumanHand.frameBones(body, side, "thumbTip"),
      ...HumanHand.frameBones(body, side, "indexTip"),
    ]),
  );
  let bones: ReturnType<typeof frames> = frames(pose);
  const wrist: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
  let top: IAutoMovieVector3 = HumanHand.frame(
    body,
    bones,
    side,
    "thumbTip",
  ).point;
  let bottom: IAutoMovieVector3 = HumanHand.frame(
    body,
    bones,
    side,
    "indexTip",
  ).point;
  const normal: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(top, bottom),
  );
  const half: number = thickness / 2;
  let center: IAutoMovieVector3 = Vector3.lerp(top, bottom, 0.5);
  for (let attempt: number = 0; attempt < 20; ++attempt) {
    const high: IAutoMovieVector3 = Vector3.addScaled(center, normal, half);
    const low: IAutoMovieVector3 = Vector3.addScaled(center, normal, -half);
    pose = HumanDigitFit.fitted(body, pose, {
      [thumb]: { point: high, surface: "tip", contact: true },
      [index]: { point: low, surface: "tip", contact: true },
    });
    bones = frames(pose);
    top = HumanHand.frame(body, bones, side, "thumbTip").point;
    bottom = HumanHand.frame(body, bones, side, "indexTip").point;
    const error: number = Math.max(
      Vector3.length(Vector3.subtract(top, high)),
      Vector3.length(Vector3.subtract(bottom, low)),
    );
    if (error <= 0.0001) break;
    center = Vector3.lerp(top, bottom, 0.5);
  }
  for (const joint of pose.joints)
    if (joints[joint.bone] !== undefined)
      joints[joint.bone] = [
        joint.flexion ?? 0,
        joint.abduction ?? 0,
        joint.twist ?? 0,
      ];
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(wrist.worldRotation);
  return {
    joints,
    contact: Quaternion.rotateVector(
      inverse,
      Vector3.subtract(center, wrist.worldPosition),
    ),
    normal: Quaternion.rotateVector(inverse, normal),
  };
}
