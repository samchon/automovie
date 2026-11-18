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

/**
 * Prepare a flat palm's contact frame and any carried target surface.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The fitted goal uses the supplied posture and optional same-posture displayed frames of the target and shoulder. It returns the wrist and its flat palm contact in world metres.
 * @evidence contracts/development/implementation.md#principled-implementation The wrist is offset from the original material site by the actual palmar frame. A carried surface supplies its own moving normal and approach tangent.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The same surface placement and palm alignment consume either a caller's current frames or this goal's own sparse reading.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The caller supplies frames of the current unchanged posture. An independent observation uses the original seeded resolver and its actual reader and projection inputs.
 * @evidence contracts/development/implementation.md#efficient-algorithms A carried site reads the target and shoulder from its caller's current displayed pose when available. Otherwise it resolves just those frames. A fixed target needs only its authored point and hand geometry.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller proves that its frames and the independent observation describe the same pose before handing those frames to this private goal builder.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure retains fixed material geometry and a bound demand. It holds no borrowed frame map or reader after a goal is returned.
 */
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
          resolveHumanPosture.seeded(body, posture, undefined, {}, read, regionBones, projection);
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
