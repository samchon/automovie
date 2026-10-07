import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { BodyContactBones } from "./BodyContactBones";
import type { IBodyContactPlane } from "./IBodyContactPlane";
import { bodyBoneAxis } from "./bodyBoneAxis";

/**
 * The fold plane of an adjacent pair: null when the two are not parent and
 * child, or when the two rays that leave the joint are nearly opposite (the
 * sum of their directions shorter than 0.2, a straight joint with no crease).
 *
 * Along a chain the parent points at the joint, so its far end lies back along
 * its own axis and the normal is the sum of the two directions; a child whose
 * head lies along the parent's axis (the thighs hang from the head end of the
 * hips bone, which points away from them up the spine) flips the parent's
 * direction. The normal points to the side of `part`.
 */
export function bisectorPlane(
  bones: BodyContactBones,
  part: string,
  other: string,
): IBodyContactPlane | null {
  const parentOf = (bone: string) =>
    bones.get(bone as AutoMovieHumanoidBone)?.parent ?? null;
  const child =
    parentOf(other) === part ? other : parentOf(part) === other ? part : null;
  if (child === null) return null;
  const parent = child === part ? other : part;
  const head = bones.get(child as AutoMovieHumanoidBone)!.position;
  const parentHead = bones.get(parent as AutoMovieHumanoidBone)!.position;
  const dp = bodyBoneAxis(bones, parent);
  const chained =
    (head.x - parentHead.x) * dp[0] +
      (head.y - parentHead.y) * dp[1] +
      (head.z - parentHead.z) * dp[2] >
    0;
  const dc = bodyBoneAxis(bones, child);
  const sum = [0, 1, 2].map((k) => dc[k] + (chained ? 1 : -1) * dp[k]);
  const size = Math.hypot(sum[0], sum[1], sum[2]);
  if (size < 0.2) return null;
  const toward = child === part ? 1 : -1;
  return {
    point: [head.x, head.y, head.z],
    normal: sum.map((one) => (toward * one) / size),
  };
}
