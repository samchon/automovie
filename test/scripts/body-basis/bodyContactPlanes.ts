import { closestPointsBetweenSegments } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { rotationMatrixOf } from "./carryBodyDisplacement";

/**
 * The separating planes of two skin segments in a pose, for the body contact
 * solver.
 *
 * Two planes are offered for a pair and the caller keeps the one that asks the
 * crossing patches for the least movement: the fold plane of a parent and its
 * child, through the child's joint and bisecting the two rays that leave it
 * (the crease of a hinge), and the contact plane of any two bones,
 * perpendicular to the shortest line between the two bone segments through its
 * midpoint (two limbs pressed together). Positions are metres in the body's
 * Y-up, Z-forward frame; a bone's own axis is its rotation's local Y column,
 * and its segment runs from its head `length` metres along that axis.
 */

/** A plane in the body frame. */
export interface IBodyContactPlane {
  /** A point on the plane. */
  point: number[];

  /** Unit normal pointing to the side segment `part` belongs on. */
  normal: number[];
}

/** The posed bones the planes read. */
export type BodyContactBones = Map<
  AutoMovieHumanoidBone,
  {
    position: IAutoMovieVector3;
    rotation: IAutoMovieQuaternion;
    length: number;
    parent: AutoMovieHumanoidBone | null;
  }
>;

const axisOf = (bones: BodyContactBones, bone: string): number[] => {
  const m = rotationMatrixOf(
    bones.get(bone as AutoMovieHumanoidBone)!.rotation,
  );
  return [m[0][1], m[1][1], m[2][1]];
};

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
  const dp = axisOf(bones, parent);
  const chained =
    (head.x - parentHead.x) * dp[0] +
      (head.y - parentHead.y) * dp[1] +
      (head.z - parentHead.z) * dp[2] >
    0;
  const dc = axisOf(bones, child);
  const sum = [0, 1, 2].map((k) => dc[k] + (chained ? 1 : -1) * dp[k]);
  const size = Math.hypot(sum[0], sum[1], sum[2]);
  if (size < 0.2) return null;
  const toward = child === part ? 1 : -1;
  return {
    point: [head.x, head.y, head.z],
    normal: sum.map((one) => (toward * one) / size),
  };
}

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
    const d = axisOf(bones, bone);
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

/** Signed distance of a vertex from a plane, positive on the normal's side. */
export function depthOfPlane(
  plane: IBodyContactPlane,
  positions: number[],
  vertex: number,
): number {
  return [0, 1, 2].reduce(
    (total, k) =>
      total + (positions[vertex * 3 + k] - plane.point[k]) * plane.normal[k],
    0,
  );
}

/**
 * Which side a vertex both segments touch belongs to, by the bone that
 * dominates it: `-1` when the bone is `other`, `+1` otherwise.
 */
export function ownerOfSeam(
  segments: Map<string, number[]>,
  dominant: (vertex: number) => string,
  part: string,
  other: string,
): Map<number, 1 | -1> {
  const owner = new Map<number, 1 | -1>();
  for (const bone of [other, part])
    for (const v of segments.get(bone)!)
      owner.set(v, dominant(v) === other ? -1 : 1);
  return owner;
}

/** Which plane a pair is solved against, and why. */
export interface IChosenBodyPlane {
  plane: IBodyContactPlane;
  kind: "fold" | "contact";
}

/**
 * The plane that asks the crossing patches for the least movement once it is
 * centred between the deepest corner of each side: the fold plane of an
 * adjacent pair or the contact plane between the two bones, whichever costs
 * less; null when neither exists. The cost is the summed shortfall of every
 * crossed corner from its own side, so a plane that already separates most
 * corners wins over one that cuts across the contact. A side with no crossed
 * corner makes both planes cost infinity and the first is returned.
 */
export function chooseContactPlane(
  bones: BodyContactBones,
  positions: number[],
  hitA: Iterable<number>,
  hitB: Iterable<number>,
  part: string,
  other: string,
): IChosenBodyPlane | null {
  const candidates: IChosenBodyPlane[] = [];
  const fold = bisectorPlane(bones, part, other);
  if (fold !== null) candidates.push({ plane: fold, kind: "fold" });
  const contact = contactPlane(bones, part, other);
  if (contact !== null) candidates.push({ plane: contact, kind: "contact" });
  if (candidates.length === 0) return null;
  const listA = [...hitA];
  const listB = [...hitB];
  const cost = (plane: IBodyContactPlane): number => {
    if (listA.length === 0 || listB.length === 0) return Infinity;
    const shift =
      (Math.min(...listA.map((v) => depthOfPlane(plane, positions, v))) +
        Math.max(...listB.map((v) => depthOfPlane(plane, positions, v)))) /
      2;
    return (
      listA.reduce(
        (sum, v) => sum + Math.max(0, shift - depthOfPlane(plane, positions, v)),
        0,
      ) +
      listB.reduce(
        (sum, v) => sum + Math.max(0, depthOfPlane(plane, positions, v) - shift),
        0,
      )
    );
  };
  return candidates.reduce((best, one) =>
    cost(one.plane) < cost(best.plane) ? one : best,
  );
}
