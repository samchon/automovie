import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { closestPointsBetweenSegments } from "../math/closestPointsBetweenSegments";

/**
 * The signed distance, metres, from a world segment to an admitted sphere, Y
 * capsule or oriented box placed by a parent pose: the least distance over
 * the segment's points to the shape's surface, negative when the segment
 * enters it. A segment whose two ends coincide is a point, so this is also
 * the point-to-shape distance.
 *
 * The shape's frame is the parent pose composed with the shape's own
 * transform, as in `physicalShapeBounds`. A sphere is its centre point and a
 * capsule its axis segment, each widened by the radius, so both reduce to
 * the closest points between two segments (`closestPointsBetweenSegments`,
 * Eberly 2023). A box uses its exact signed distance (the outside distance
 * of the clamped excess, or the largest negative excess inside); that
 * function is convex in space and so convex along the segment, and 44
 * golden-section steps narrow the segment's unit parameter below 1e-9 before
 * the least of both ends and the two final probes is taken.
 *
 * @param pose The shape's parent pose, world metres.
 * @param shape The admitted shape.
 * @param a One end of the segment, world metres.
 * @param b The other end, world metres.
 * @returns The signed distance, metres; negative inside.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame composition, the sign, the point case and the method for each shape kind with its precision.
 * @evidence contracts/development/implementation.md#principled-implementation Spheres and capsules are segments widened by a radius, so their distance is the engine's exact closest-segment-points query less the radius; a box's signed distance is convex, so golden-section search along the segment finds its minimum to 1e-9 of the parameter without missing an entry.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The single owner of shape-to-segment distance: the frame composition, then one branch per shape kind, reusing `closestPointsBetweenSegments` instead of restating it; `curlChainUntilContact` and the motions colliders call this.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance is added to the distance; the 44 golden-section steps are the count that narrows a unit interval below 1e-9 (0.618^44 ≈ 6.4e-10), and the shape's dimensions are taken as admitted by the profile.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per call: one closest-segment query for a sphere or capsule, 46 box evaluations for a box.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its four arguments; callers that query many shapes hold their own placed frames.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps nothing between calls; its temporaries die with the call.
 */
export function physicalShapeSegmentDistance(
  pose: P.ITransform,
  shape: P.IShape,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): number {
  const centre: IAutoMovieVector3 = Vector3.add(
    pose.position,
    Quaternion.rotateVector(pose.rotation, shape.transform.position),
  );
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    pose.rotation,
    shape.transform.rotation,
  );
  if (shape.kind === "sphere")
    return (
      closestPointsBetweenSegments(a, b, centre, centre).distance - shape.radius
    );
  if (shape.kind === "capsule") {
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: shape.halfLength,
      z: 0,
    });
    return (
      closestPointsBetweenSegments(
        a,
        b,
        Vector3.subtract(centre, axis),
        Vector3.add(centre, axis),
      ).distance - shape.radius
    );
  }
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(rotation);
  const la: IAutoMovieVector3 = Quaternion.rotateVector(
    inverse,
    Vector3.subtract(a, centre),
  );
  const lb: IAutoMovieVector3 = Quaternion.rotateVector(
    inverse,
    Vector3.subtract(b, centre),
  );
  const h: IAutoMovieVector3 = shape.halfExtents;
  const box = (t: number): number => {
    const qx: number = Math.abs(la.x + (lb.x - la.x) * t) - h.x;
    const qy: number = Math.abs(la.y + (lb.y - la.y) * t) - h.y;
    const qz: number = Math.abs(la.z + (lb.z - la.z) * t) - h.z;
    return (
      Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) +
      Math.min(Math.max(qx, qy, qz), 0)
    );
  };
  const ratio: number = (Math.sqrt(5) - 1) / 2;
  let lo: number = 0;
  let hi: number = 1;
  let c: number = hi - ratio * (hi - lo);
  let d: number = lo + ratio * (hi - lo);
  let fc: number = box(c);
  let fd: number = box(d);
  for (let i: number = 0; i < 44; i++) {
    if (fc <= fd) {
      hi = d;
      d = c;
      fd = fc;
      c = hi - ratio * (hi - lo);
      fc = box(c);
    } else {
      lo = c;
      c = d;
      fc = fd;
      d = lo + ratio * (hi - lo);
      fd = box(d);
    }
  }
  return Math.min(box(0), box(1), fc, fd);
}
