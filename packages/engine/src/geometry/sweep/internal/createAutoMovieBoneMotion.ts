import {
  AutoMovieHumanoidBone,
  type IAutoMovieCreateBoneMotion,
  IAutoMovieQuaternion,
  type IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../../math/Quaternion";
import { Vector3 } from "../../../math/Vector3";

/**
 * Build each bone's rigid motion from rest to pose, the transform a point or a
 * direction fixed in that bone undergoes.
 *
 * Bone `b` carries a point `p` to `P_b + Q_b R_b^-1 (p - O_b)`, with rest
 * origin `O_b` and rotation `R_b` and posed origin `P_b` and rotation `Q_b` in
 * model space, the rigid transform `skinAutoMovieMesh` applies per joint.
 * Directions take the rotation `Q_b R_b^-1` alone.
 *
 * @param props.rest Bones at rest, from `resolvePose` of an empty pose.
 * @param props.posed The same bones in the pose.
 * @returns A lookup giving a bone's rotation and point map.
 * @throws Error from the lookup when a bone is missing from either list.
 */
export const createAutoMovieBoneMotion: (
  props: IAutoMovieCreateBoneMotion.IProps,
) => (bone: AutoMovieHumanoidBone) => {
  rotation: IAutoMovieQuaternion;
  apply: (point: IAutoMovieVector3) => IAutoMovieVector3;
} = (
  props: IAutoMovieCreateBoneMotion.IProps,
): ((bone: AutoMovieHumanoidBone) => {
  rotation: IAutoMovieQuaternion;
  apply: (point: IAutoMovieVector3) => IAutoMovieVector3;
}) => {
  const rest: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
    props.rest.map(
      (
        b: IAutoMovieResolvedBone,
      ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [b.bone, b],
    ),
  );
  const posed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
    props.posed.map(
      (
        b: IAutoMovieResolvedBone,
      ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [b.bone, b],
    ),
  );
  const cache: Map<AutoMovieHumanoidBone, IAutoMovieQuaternion> = new Map();
  return (bone: AutoMovieHumanoidBone) => {
    const r: IAutoMovieResolvedBone | undefined = rest.get(bone);
    const p: IAutoMovieResolvedBone | undefined = posed.get(bone);
    if (r === undefined || p === undefined)
      throw new Error(`bone ${bone} is missing from the rest or posed bones`);
    let rotation: IAutoMovieQuaternion | undefined = cache.get(bone);
    if (rotation === undefined) {
      rotation = Quaternion.normalize(
        Quaternion.multiply(
          p.worldRotation,
          Quaternion.inverse(r.worldRotation),
        ),
      );
      cache.set(bone, rotation);
    }
    const q: IAutoMovieQuaternion = rotation;
    return {
      rotation: q,
      apply: (point: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(
          p.worldPosition,
          Quaternion.rotateVector(q, Vector3.subtract(point, r.worldPosition)),
        ),
    };
  };
};
