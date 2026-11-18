import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The signed distance to the box enclosing the hull in its local frame.
 * Inside the box, the bound is the negative distance to the nearest face.
 * A non-hull yields negative infinity so the exact shape query stays eligible.
 *
 * The point is carried into the shape's frame through the segment's pose and
 * the shape's own transform, as the exact distance carries it
 * (`physicalShapeSegmentDistance`), and the box is the hull points' least
 * and greatest coordinates on each of the frame's axes, a constant of the
 * hull's points.
 *
 * @param shape The placed shape.
 * @param p The point, world metres.
 * @returns A lower bound on signed clearance in metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the bound, the frame it is read in, the box and the cases that bound nothing.
 * @evidence contracts/development/implementation.md#principled-implementation Outside the enclosing box its nearest point is at least as close as the hull. Inside the hull, leaving the box requires at least as much travel as leaving the hull, so the negative distance to the box boundary bounds signed clearance there as well. The result is lessened by `ROUNDING`, more than the rounding of the two rotations of a point a few metres out, so it stays a bound as computed.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The point into the segment's frame, into the shape's, then one clamp per axis.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only a bound: its callers decide nothing from it that the exact distance could reverse (`HumanArmTrajectoryPairs.deepest`).
 * @evidence contracts/development/implementation.md#efficient-algorithms Two rotations of a point and six comparisons, against the exact query's support search over the hull's faces; the box is built once for a hull's points (O(V)).
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A hull's box is kept with its points, which do not change once the shape is built.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The boxes are held weakly by their hulls' point arrays and released with them; nothing of a query is kept.
 */
export function HumanArmShapeBox(
  shape: IAutoMovieMotionHumanArmGeometry.IShape,
  p: IAutoMovieVector3,
): number {
  const solid: IAutoMovieMotionHumanArmGeometry.IShape["shape"] = shape.shape;
  if (solid.kind !== "hull") return -Infinity;
  let box: Float64Array | undefined = BOXES.get(solid.points);
  if (box === undefined) {
    box = new Float64Array([
      Infinity,
      Infinity,
      Infinity,
      -Infinity,
      -Infinity,
      -Infinity,
    ]);
    for (const v of solid.points) {
      box[0] = Math.min(box[0]!, v.x);
      box[1] = Math.min(box[1]!, v.y);
      box[2] = Math.min(box[2]!, v.z);
      box[3] = Math.max(box[3]!, v.x);
      box[4] = Math.max(box[4]!, v.y);
      box[5] = Math.max(box[5]!, v.z);
    }
    BOXES.set(solid.points, box);
  }
  // The point in the segment's frame, then in the shape's.
  const segment: IAutoMovieVector3 = unturn(
    shape.pose.rotation,
    p.x - shape.pose.position.x,
    p.y - shape.pose.position.y,
    p.z - shape.pose.position.z,
  );
  const t: IAutoMovieMotionHumanArmGeometry.IShape["shape"]["transform"] =
    solid.transform;
  const local: IAutoMovieVector3 = unturn(
    t.rotation,
    segment.x - t.position.x,
    segment.y - t.position.y,
    segment.z - t.position.z,
  );
  const dx: number = Math.max(box[0]! - local.x, local.x - box[3]!);
  const dy: number = Math.max(box[1]! - local.y, local.y - box[4]!);
  const dz: number = Math.max(box[2]! - local.z, local.z - box[5]!);
  const face: number = Math.max(dx, dy, dz);
  if (face <= 0) return face - ROUNDING;
  const x: number = Math.max(0, dx);
  const y: number = Math.max(0, dy);
  const z: number = Math.max(0, dz);
  return Math.sqrt(x * x + y * y + z * z) - ROUNDING;
}

/** A vector turned by the inverse of a unit rotation: the rotation's conjugate applied. */
function unturn(
  q: { x: number; y: number; z: number; w: number },
  vx: number,
  vy: number,
  vz: number,
): IAutoMovieVector3 {
  const qx: number = -q.x;
  const qy: number = -q.y;
  const qz: number = -q.z;
  const tx: number = 2 * (qy * vz - qz * vy);
  const ty: number = 2 * (qz * vx - qx * vz);
  const tz: number = 2 * (qx * vy - qy * vx);
  return {
    x: vx + q.w * tx + (qy * tz - qz * ty),
    y: vy + q.w * ty + (qz * tx - qx * tz),
    z: vz + q.w * tz + (qx * ty - qy * tx),
  };
}

/** Each hull's box, by its point array: least x, y, z, then greatest. */
const BOXES: WeakMap<readonly IAutoMovieVector3[], Float64Array> =
  new WeakMap();

/** Metres taken off the box's distance: far more than the rounding of two rotations and three differences of points a few metres from the origin (about 1e-15 m). */
const ROUNDING: number = 1e-12;
