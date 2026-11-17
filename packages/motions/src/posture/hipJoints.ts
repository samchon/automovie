import { type IAutoMovieResolvedBone, type preparePoseResolution, Transform } from "@automovie/engine";
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

/** One genuine static two-hip demand per live unchanged body, without any pose state. */
const HIP_READERS: WeakMap<IHumanBody, ReturnType<typeof poseBones.prepare>> = new WeakMap();

/**
 * The two hip joints under a root: they depend only on the root, its
 * rotation and the pelvis joint, so a turned or listed pelvis counts and no
 * other joint needs posing.
 *
 * @param body The body.
 * @param root The root, world metres.
 * @param rotation The root's world rotation.
 * @param pelvis The pelvis joint's clinical angles, degrees; rest when absent.
 * @param prepared Optional exact FK reader borrowed from this synchronous person evaluation; never retained in the two returned points.
 * @returns Each hip joint, world metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States world-metre root/outputs, clinical pelvis degrees and the exact two requested origins.
 * @evidence contracts/development/implementation.md#principled-implementation Upper-leg origins follow their complete root-to-pelvis ancestry under canonical prepared FK; only pelvis articulation is authored because other limb joints cannot move those origins.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One demanded poseBones read supplies both origins; the local side lookup alone owns the missing-hip diagnostic.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No neutral pelvis approximation or fixed offset replaces the rig's actual FK, and a missing upper leg throws rather than inventing its hip.
 * @evidence contracts/development/implementation.md#efficient-algorithms The two-name demand is prepared once per body. Each read admits at most one joint, checks only the two hips' ancestry and returns two fresh records instead of the full hierarchy; runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The unchanged body owns static canonical prerequisites and the fixed HIP_BONES selection. A weakly owned bound demand reuses only those indices; a supplied same-person reader shares actual exact dependencies with lowering/guard reads. No pose or query result is retained.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One static demand closure per weak live-body key releases with that body and retains no operation reader or pose. Each call owns a small pose/map and two fresh output points, without history, handles or tasks.
 */
export function hipJoints(
  body: IHumanBody,
  root: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  pelvis?: readonly [number, number, number],
  prepared?: ReturnType<typeof preparePoseResolution>,
): Record<"left" | "right", IAutoMovieVector3> {
  let read: ReturnType<typeof poseBones.prepare> | undefined = HIP_READERS.get(body);
  if (read === undefined) {
    read = poseBones.prepare(body, HIP_BONES);
    HIP_READERS.set(body, read);
  }
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = read(
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
  );
  return { left: hipOf(bones, "left"), right: hipOf(bones, "right") };
}

/** Read one fresh hip origin without allocating a per-query side closure. */
function hipOf(
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  side: "left" | "right",
): IAutoMovieVector3 {
  const hip: IAutoMovieResolvedBone | undefined = bones.get(`${side}UpperLeg`);
  if (hip === undefined)
    throw new Error(`The rig lacks ${side}UpperLeg, so it has no hip joint`);
  return hip.worldPosition;
}
