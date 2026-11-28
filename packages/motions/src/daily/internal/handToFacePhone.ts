import {
  AutoMovieEnginePhysics,
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTouchEffector } from "../../compose/internal/AutoMovieMotionHumanTouchEffector";
import { HumanColliders } from "../../posture/internal/HumanColliders";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";

/*
 * Place the implied phone beyond the palm-facing support of the laid hand.
 * The phone row supplies its own reach beyond that plane. A posed finger
 * can extend past the palm socket into the space the tool needs.
 * Resolve the acting hand in the row's form once and keep the same local
 * contact directions when extending the implied tool.
 */
export function handToFacePhone(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  effector: IAutoMovieMotionHumanTouchEffector.IEffector,
): IAutoMovieMotionHumanTouchEffector.IEffector {
  const wrist: AutoMovieHumanoidBone =
    side === "left" ? "leftHand" : "rightHand";
  const joints: IAutoMovieJointPose[] = Object.entries(
    HumanHand.shape(side, effector.shape),
  ).map(
    ([bone, angles]): IAutoMovieJointPose => ({
      bone: bone as AutoMovieHumanoidBone,
      flexion: angles![0],
      abduction: angles![1],
      twist: angles![2],
    }),
  );
  const requested: Set<AutoMovieHumanoidBone> = new Set([
    wrist,
    ...joints.map((joint) => joint.bone),
  ]);
  const bones = poseBones(
    body,
    { skeleton: body.skeleton.id, root: null, joints },
    undefined,
    requested,
  );
  const palm: IAutoMovieVector3 = AutoMovieMotionHumanTouchEffector.point(
    body,
    bones,
    side,
    { ...effector, tool: undefined },
  );
  const normal: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    bones.get(wrist)!.worldRotation,
    AutoMovieMotionHumanTouchEffector.axis(side, "palm"),
  );
  let extension: number = 0;
  for (const part of HumanColliders.placed(body, bones))
    for (const shape of part.shapes) {
      const support: IAutoMovieVector3 =
        AutoMovieEnginePhysics.physicalShapeSupport(part.pose, shape, normal);
      extension = Math.max(
        extension,
        AutoMovieEngineVector3.dot(
          AutoMovieEngineVector3.subtract(support, palm),
          normal,
        ),
      );
    }
  const reach: number = (effector.tool?.palm ?? 0) * body.measure.hand;
  return {
    ...effector,
    tool: { ...effector.tool, palm: (reach + extension) / body.measure.hand },
  };
}
