import { Transform, preparePoseResolution } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBoneGroups } from "../HumanBoneGroups";
import { poseBones } from "./poseBones";

/**
 * The two hip joints under a root: they depend only on the root, its rotation
 * and the pelvis joint, so a turned or listed pelvis counts and no other joint
 * needs posing.
 *
 * @param body The body.
 * @param root The root, world metres.
 * @param rotation The root's world rotation.
 * @param pelvis The pelvis joint's clinical angles, degrees; rest when absent.
 * @param prepared Optional exact FK reader borrowed from this synchronous
 *   person evaluation; never retained in the two returned points.
 * @returns Each hip joint, world metres.
 */
export function hipJoints(
  body: IAutoMovieMotionHumanBody,
  root: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  pelvis?: readonly [number, number, number],
  prepared?: ReturnType<typeof preparePoseResolution>,
): Record<AutoMovieHumanSide, IAutoMovieVector3> {
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    {
      skeleton: body.skeleton.id,
      root: Transform.of(root, rotation),
      joints:
        pelvis === undefined
          ? []
          : [
              {
                bone: "hips",
                flexion: pelvis[0],
                abduction: pelvis[1],
                twist: pelvis[2],
              },
            ],
    },
    prepared,
    HumanBoneGroups.THIGHS,
  );
  return { left: hipOf(bones, "left"), right: hipOf(bones, "right") };
}

/** Read one fresh hip origin without allocating a per-query side closure. */
function hipOf(
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  side: AutoMovieHumanSide,
): IAutoMovieVector3 {
  const hip: IAutoMovieResolvedBone | undefined = bones.get(`${side}UpperLeg`);
  if (hip === undefined)
    throw new Error(`The rig lacks ${side}UpperLeg, so it has no hip joint`);
  return hip.worldPosition;
}
