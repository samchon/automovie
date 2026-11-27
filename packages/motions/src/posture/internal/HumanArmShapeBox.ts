import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * The signed distance to the box enclosing the hull in its local frame. Inside
 * the box, the bound is the negative distance to the nearest face. A non-hull
 * yields negative infinity so the exact shape query stays eligible.
 *
 * The point is carried into the shape's frame through the segment's pose and
 * the shape's own transform, as the exact distance carries it
 * (`physicalShapeSegmentDistance`), and the box is the hull points' least and
 * greatest coordinates on each of the frame's axes, a constant of the hull's
 * points.
 * Parameter shape: The placed shape.
 * Parameter p: The point, world metres.
 * Returns: A lower bound on signed clearance in metres.
 */
export function HumanArmShapeBox(
  shape: IAutoMovieMotionHumanArmGeometry.IShape,
  p: IAutoMovieVector3,
): number {
  const solid: IAutoMovieMotionHumanArmGeometry.IShape["shape"] = shape.shape;
  if (solid.kind !== "hull") return -Infinity;
  const box: Readonly<Float64Array> = shape.hullBox ?? extrema(solid.points);

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

/*
 * The local box used to bound signed distance to a hull.
 */
export namespace HumanArmShapeBox {
  /*
   * Take a fixed obstacle's axis extrema once when its frame is prepared.
   * Parameter shape: The obstacle's borrowed shape.
   * Returns: The hull's local least x, y, z and greatest x, y, z, in metres.
   */
  export function prepare(
    shape: IAutoMovieMotionHumanArmGeometry.IShape["shape"],
  ): IAutoMovieMotionHumanArmGeometry.IShape["hullBox"] {
    return shape.kind === "hull" ? extrema(shape.points) : undefined;
  }
}

/*
 * Pack the vertex extrema without changing their order or arithmetic.
 */
function extrema(points: readonly IAutoMovieVector3[]): Float64Array {
  const box: Float64Array = new Float64Array([
    Infinity,
    Infinity,
    Infinity,
    -Infinity,
    -Infinity,
    -Infinity,
  ]);
  for (const v of points) {
    box[0] = Math.min(box[0]!, v.x);
    box[1] = Math.min(box[1]!, v.y);
    box[2] = Math.min(box[2]!, v.z);
    box[3] = Math.max(box[3]!, v.x);
    box[4] = Math.max(box[4]!, v.y);
    box[5] = Math.max(box[5]!, v.z);
  }
  return box;
}

/*
 * The record of `IUnturnQ`'s site.
 */
type IUnturnQ = { x: number; y: number; z: number; w: number };

/*
 * A vector turned by the inverse of a unit rotation: the rotation's conjugate
 * applied.
 */
function unturn(
  q: IUnturnQ,
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


/*
 * Metres taken off the box's distance: far more than the rounding of two
 * rotations and three differences of points a few metres from the origin (about
 * 1e-15 m).
 */
const ROUNDING: number = 1e-12;
