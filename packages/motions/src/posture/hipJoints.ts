import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { poseBones } from "./poseBones";

/**
 * The two hip joints under a root: they depend only on the root, its
 * rotation and the pelvis joint, so a turned or listed pelvis counts and no
 * other joint needs posing.
 *
 * @param body The body.
 * @param root The root, world metres.
 * @param rotation The root's world rotation.
 * @param pelvis The pelvis joint's clinical angles, degrees; rest when absent.
 * @returns Each hip joint, world metres.
 */
export function hipJoints(
  body: IHumanBody,
  root: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  pelvis?: readonly [number, number, number],
): Record<"left" | "right", IAutoMovieVector3> {
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    {
      skeleton: body.skeleton.id,
      root: { translation: root, rotation, scale: { x: 1, y: 1, z: 1 } },
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
  );
  const of = (side: "left" | "right"): IAutoMovieVector3 => {
    const hip: IAutoMovieResolvedBone | undefined = bones.get(
      `${side}UpperLeg`,
    );
    if (hip === undefined)
      throw new Error(`The rig lacks ${side}UpperLeg, so it has no hip joint`);
    return hip.worldPosition;
  };
  return { left: of("left"), right: of("right") };
}
