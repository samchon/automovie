import { AutoMovieHumanoidBone, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieResolvedBone } from "../../kinematics/IAutoMovieResolvedBone";
import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";

/**
 * Build each bone's rigid motion from rest to pose, the transform a point or
 * a direction fixed in that bone undergoes.
 *
 * Bone `b` carries a point `p` to `P_b + Q_b R_b^-1 (p - O_b)`, with rest
 * origin `O_b` and rotation `R_b` and posed origin `P_b` and rotation `Q_b`
 * in model space, the rigid transform `skinAutoMovieMesh` applies per joint.
 * Directions take the rotation `Q_b R_b^-1` alone.
 *
 * @param props.rest Bones at rest, from `resolvePose` of an empty pose.
 * @param props.posed The same bones in the pose.
 * @returns A lookup giving a bone's rotation and point map.
 * @throws Error from the lookup when a bone is missing from either list.
 *
 * @evidence contracts/common.md#principled-implementation The rigid motion of a frame from rest to pose, the same per-joint transform linear and dual-quaternion skinning blend, applied unblended because sweep bindings follow one bone at a time.
 * @evidence contracts/common.md#clear-and-simple-design One lookup shared by the sweep and network posers, so points, directions and station orientations all use the same transform.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A bone missing from either list is refused instead of treated as unmoved.
 * @evidence contracts/common.md#meaningful-documentation States the transform, its frames, what the lookup returns and when it fails.
 * @evidence contracts/performance.md#efficient-algorithms O(B) to index B bones once, then constant time per bone lookup and per mapped point.
 * @evidence contracts/performance.md#reuse-equivalent-work Each bone's relative rotation is computed once on first use and cached for every later point of that bone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains the two bone maps and at most one cached rotation per bone, released with the closure.
 */
export const createAutoMovieBoneMotion: (props: {
  rest: readonly IAutoMovieResolvedBone[];
  posed: readonly IAutoMovieResolvedBone[];
}) => (bone: AutoMovieHumanoidBone) => {
  rotation: IAutoMovieQuaternion;
  apply: (point: IAutoMovieVector3) => IAutoMovieVector3;
} = (props: {
  rest: readonly IAutoMovieResolvedBone[];
  posed: readonly IAutoMovieResolvedBone[];
}): ((bone: AutoMovieHumanoidBone) => {
  rotation: IAutoMovieQuaternion;
  apply: (point: IAutoMovieVector3) => IAutoMovieVector3;
}) => {
  const rest: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
    props.rest.map((b: IAutoMovieResolvedBone): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [b.bone, b]),
  );
  const posed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
    props.posed.map((b: IAutoMovieResolvedBone): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [b.bone, b]),
  );
  const cache: Map<AutoMovieHumanoidBone, IAutoMovieQuaternion> = new Map();
  return (bone: AutoMovieHumanoidBone) => {
    const r: IAutoMovieResolvedBone | undefined = rest.get(bone);
    const p: IAutoMovieResolvedBone | undefined = posed.get(bone);
    if (r === undefined || p === undefined) throw new Error(`bone ${bone} is missing from the rest or posed bones`);
    let rotation: IAutoMovieQuaternion | undefined = cache.get(bone);
    if (rotation === undefined) {
      rotation = Quaternion.normalize(Quaternion.multiply(p.worldRotation, Quaternion.inverse(r.worldRotation)));
      cache.set(bone, rotation);
    }
    const q: IAutoMovieQuaternion = rotation;
    return {
      rotation: q,
      apply: (point: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(p.worldPosition, Quaternion.rotateVector(q, Vector3.subtract(point, r.worldPosition))),
    };
  };
};
