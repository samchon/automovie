import { closestPointsBetweenSegments } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { BodyContactBones } from "./BodyContactBones";
import type { IBodyContactPlane } from "./IBodyContactPlane";
import { bodyBoneAxis } from "./bodyBoneAxis";

/**
 * The contact plane between two bone segments: perpendicular to the shortest
 * line between them through its midpoint, normal from `other` toward `part`.
 * Null when the two bones are within a millimetre, where the line has no
 * direction.
 */
export function contactPlane(
  bones: BodyContactBones,
  part: string,
  other: string,
): IBodyContactPlane | null {
  const segment = (bone: string): [IAutoMovieVector3, IAutoMovieVector3] => {
    const own = bones.get(bone as AutoMovieHumanoidBone)!;
    const d = bodyBoneAxis(bones, bone);
    return [
      own.position,
      {
        x: own.position.x + own.length * d[0],
        y: own.position.y + own.length * d[1],
        z: own.position.z + own.length * d[2],
      },
    ];
  };
  const [p0, p1] = segment(part);
  const [q0, q1] = segment(other);
  const { pointA, pointB, distance } = closestPointsBetweenSegments(
    p0,
    p1,
    q0,
    q1,
  );
  if (distance < 0.001) return null;
  return {
    point: [
      (pointA.x + pointB.x) / 2,
      (pointA.y + pointB.y) / 2,
      (pointA.z + pointB.z) / 2,
    ],
    normal: [
      (pointA.x - pointB.x) / distance,
      (pointA.y - pointB.y) / distance,
      (pointA.z - pointB.z) / distance,
    ],
  };
}
