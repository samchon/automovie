import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/** Displayed world frames of a single resolved posture. */
type Bones = ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

/** The reached wrist and palm contact in the actual lower body's frame. */
type Goal = (
  posture: IAutoMovieMotionHumanPosture,
  source?: Parameters<typeof prepareHumanPoseResolution>[0],
  projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
  placed?: Bones,
) => IAutoMovieHumanLimbGoal;

/** Prepare a flat palm's contact frame and any carried target surface. */
export function prepareBendGoal(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  target: IAutoMovieVector3,
  region: IAutoMovieHumanoidSurfaces.IFrame | undefined,
  reachOut: number,
): Goal {
  const shoulder: AutoMovieHumanoidBone = `${side}UpperArm`;
  const regionBones: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>(
      region === undefined ? [] : [region.bone, shoulder],
    );
  const readRegion: ReturnType<typeof poseBones.prepare> | undefined =
    region === undefined ? undefined : poseBones.prepare(body, regionBones);
  const palm: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(
    body,
    side,
    "palm",
    "flat",
  );
  return (
    posture: IAutoMovieMotionHumanPosture,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
    placed?: Bones,
  ): IAutoMovieHumanLimbGoal => {
    let point: IAutoMovieVector3 = target;
    let normal: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };
    let forward: IAutoMovieVector3 = HumanFrame.forward(posture.yaw);
    if (region !== undefined && readRegion !== undefined) {
      let bones: Bones | undefined = placed;
      if (bones === undefined) {
        const read: ReturnType<typeof prepareHumanPoseResolution> =
          prepareHumanPoseResolution(source);
        const resolved: ReturnType<typeof resolveHumanPosture.seeded> =
          resolveHumanPosture.seeded(
            body,
            posture,
            undefined,
            {},
            read,
            regionBones,
            projection,
          );
        bones = readRegion(resolved.pose, read());
      }
      const skin: ReturnType<typeof resolveAutoMovieHumanoidSurfaces.place> =
        resolveAutoMovieHumanoidSurfaces.place(region, bones.get(region.bone)!);
      point = skin.point;
      normal = Vector3.scale(skin.normal, -1);
      // The palm meets a carried surface from the shoulder's side. Its
      // in-plane finger direction follows the reach across that surface.
      const approach: IAutoMovieVector3 = Vector3.subtract(
        point,
        bones.get(shoulder)!.worldPosition,
      );
      const tangent: IAutoMovieVector3 = Vector3.addScaled(
        approach,
        normal,
        -Vector3.dot(approach, normal),
      );
      if (Vector3.dot(tangent, tangent) > 0) forward = tangent;
    }
    const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
      body,
      posture,
      side,
      reachOut,
    );
    return AutoMovieMotionHumanArm.goal(body, side, {
      surface: "palm",
      shape: "flat",
      offset: palm.point,
      point,
      rotation: HumanHand.align(palm, { normal, forward }),
      bend,
    });
  };
}
