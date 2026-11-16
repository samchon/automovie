import { type IAutoMovieResolvedBone, Transform } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { poseBones } from "./poseBones";

/** Only the two upper-leg origins are outputs; FK includes their pelvis ancestry. */
const HIP_BONES: ReadonlySet<AutoMovieHumanoidBone> =
  new Set(["leftUpperLeg", "rightUpperLeg"]);

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States world-metre root/outputs, clinical pelvis degrees and the exact two requested origins.
 * @evidence contracts/development/implementation.md#principled-implementation Upper-leg origins follow their complete root-to-pelvis ancestry under canonical prepared FK; only pelvis articulation is authored because other limb joints cannot move those origins.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One demanded poseBones read supplies both origins; the local side lookup alone owns the missing-hip diagnostic.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No neutral pelvis approximation or fixed offset replaces the rig's actual FK, and a missing upper leg throws rather than inventing its hip.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most one authored joint is admitted; only the two hips' ancestor closure is computed and two fresh bone records are returned instead of the full hierarchy. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The body owns immutable canonical FK prerequisites and the shared HIP_BONES set selects only actual outputs; no pose or query result is retained.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources This call owns one small pose/map and two output vectors; returned points are fresh and no operation reader, pose history, handle or task is retained.
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
    undefined,
    HIP_BONES,
  );
  const of: (side: "left" | "right") => IAutoMovieVector3 =
    (side: "left" | "right"): IAutoMovieVector3 => {
    const hip: IAutoMovieResolvedBone | undefined = bones.get(
      `${side}UpperLeg`,
    );
    if (hip === undefined)
      throw new Error(`The rig lacks ${side}UpperLeg, so it has no hip joint`);
    return hip.worldPosition;
  };
  return { left: of("left"), right: of("right") };
}
