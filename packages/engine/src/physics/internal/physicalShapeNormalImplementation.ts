import type {
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { physicalShapeHull } from "./physicalShapeHull";


/**
 * Read normals on one unchanged admitted frame/shape during an operation. The
 * centre, rotation and the kind's axis, inverse rotation and planes are
 * prepared once here; every point retains the original radial checks, plane
 * heights, exponential weights, summation order and normalization.
 */
function physicalShapeNormalPrepare(
  frame: IAutoMovieRigidTransform,
  shape: IAutoMoviePhysicalShape,
): (
  point: IAutoMovieVector3,
  fallback: IAutoMovieVector3,
) => IAutoMovieVector3 {
  const prepared: IPrepared = prepareNormal(frame, shape);
  return (
    point: IAutoMovieVector3,
    fallback: IAutoMovieVector3,
  ): IAutoMovieVector3 => normal(shape, point, fallback, prepared);
}

/**
 * The outward unit normal of a collider at a point of its surface: a sphere's
 * radius through it, a capsule's from the nearest point of its axis, and, for a
 * box or a hull, the gradient of the smooth maximum of its face planes
 * (`SMOOTH`): the face normals weighed by how near the point lies to each
 * plane. Farther from edges, the closest face dominates; a point that crosses
 * an edge turns its normal continuously from one face's to the next, where a
 * face's own normal would step by their angle. The fallback where the radius or
 * the axis offset has no length.
 *
 * @param frame The segment's pose.
 * @param shape The collider.
 * @param point The point of its surface, in the frame `frame` is in.
 * @param fallback The direction returned where the normal has no direction.
 * @returns The outward unit normal.
 */
function physicalShapeNormal(
  frame: IAutoMovieRigidTransform,
  shape: IAutoMoviePhysicalShape,
  point: IAutoMovieVector3,
  fallback: IAutoMovieVector3,
): IAutoMovieVector3 {
  return normal(shape, point, fallback, prepareNormal(frame, shape));
}

/**
 * Canonical face order: negative then positive X, Y and Z, as in the original
 * plane construction.
 */
const BOX: readonly IBoxPlane[] = [
  { axis: "x", normal: { x: -1, y: 0, z: 0 } },
  { axis: "x", normal: { x: 1, y: 0, z: 0 } },
  { axis: "y", normal: { x: 0, y: -1, z: 0 } },
  { axis: "y", normal: { x: 0, y: 1, z: 0 } },
  { axis: "z", normal: { x: 0, y: 0, z: -1 } },
  { axis: "z", normal: { x: 0, y: 0, z: 1 } },
];

/**
 * How wide, metres, a box's or a hull's normal blends across an edge
 * (`physicalShapeNormal`), provisional: half the 10 mm a pressed skin gives, so
 * a face's middle keeps its own normal (a face 30 mm off weighs e^-6 of it) and
 * an edge turns within a fingertip's breadth.
 */
const SMOOTH: number = 0.005;

/** Metres under which a radius or a normal has no direction. */
const BOUNDARY: number = 1e-9;

/** Prepare one framed collider's centre, orientation and planes. */
function prepareNormal(
  frame: IAutoMovieRigidTransform,
  shape: IAutoMoviePhysicalShape,
): IPrepared {
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    frame.rotation,
    shape.transform.rotation,
  );
  return {
    centre: centreOfShape(frame, shape),
    rotation,
    axis: Quaternion.rotateVector(rotation, { x: 0, y: 1, z: 0 }),
    inverse: Quaternion.inverse(rotation),
    planes:
      shape.kind === "hull"
        ? physicalShapeHull(shape).faces
        : shape.kind === "box"
          ? BOX.map(
              (
                plane: IBoxPlane,
              ): { normal: IAutoMovieVector3; offset: number } => ({
                normal: plane.normal,
                offset: shape.halfExtents[plane.axis],
              }),
            )
          : [],
  };
}

/**
 * The same current-point normal equations serve direct and fixed-geometry
 * readers.
 */
function normal(
  shape: IAutoMoviePhysicalShape,
  point: IAutoMovieVector3,
  fallback: IAutoMovieVector3,
  prepared: IPrepared,
): IAutoMovieVector3 {
  const { centre, rotation, axis, inverse, planes }: IPrepared = prepared;
  if (shape.kind === "sphere") return radial(point, centre, fallback);
  if (shape.kind === "capsule") {
    const along: number = Math.max(
      -shape.halfLength,
      Math.min(
        shape.halfLength,
        Vector3.dot(Vector3.subtract(point, centre), axis),
      ),
    );
    const middle: IAutoMovieVector3 = Vector3.scale(axis, along);
    middle.x = centre.x + middle.x;
    middle.y = centre.y + middle.y;
    middle.z = centre.z + middle.z;
    return radial(point, middle, fallback);
  }
  const o: IAutoMovieVector3 = Quaternion.rotateVector(
    inverse,
    Vector3.subtract(point, centre),
  );
  const heights: number[] = planes.map(
    (plane: { normal: IAutoMovieVector3; offset: number }): number =>
      Vector3.dot(plane.normal, o) - plane.offset,
  );
  const top: number = Math.max(...heights);
  let x: number = 0;
  let y: number = 0;
  let z: number = 0;
  for (let k: number = 0; k < planes.length; k++) {
    const plane: { normal: IAutoMovieVector3; offset: number } = planes[k]!;
    const weight: number = Math.exp((heights[k]! - top) / SMOOTH);
    x += plane.normal.x * weight;
    y += plane.normal.y * weight;
    z += plane.normal.z * weight;
  }
  const sum: IAutoMovieVector3 = { x, y, z };
  return Vector3.length(sum) > BOUNDARY
    ? Vector3.normalize(Quaternion.rotateVector(rotation, sum))
    : fallback;
}

/**
 * Preserve the exact radial threshold and borrowed fallback without a per-query
 * closure.
 */
function radial(
  point: IAutoMovieVector3,
  from: IAutoMovieVector3,
  fallback: IAutoMovieVector3,
): IAutoMovieVector3 {
  const r: IAutoMovieVector3 = Vector3.subtract(point, from);
  return Vector3.length(r) > BOUNDARY ? Vector3.normalize(r) : fallback;
}

/**
 * The rotated offset is exclusively owned, so parent translation needs no
 * second vector.
 */
function centreOfShape(
  frame: IAutoMovieRigidTransform,
  shape: IAutoMoviePhysicalShape,
): IAutoMovieVector3 {
  const origin: IAutoMovieVector3 = frame.position;
  const centre: IAutoMovieVector3 = Quaternion.rotateVector(
    frame.rotation,
    shape.transform.position,
  );
  centre.x = origin.x + centre.x;
  centre.y = origin.y + centre.y;
  centre.z = origin.z + centre.z;
  return centre;
}

/** Internal implementations shared by the one-function entry modules. */
/** Internal typed runtime implementations shared by the query entry modules. */
export const physicalShapeNormalImplementation: {
  physicalShapeNormal: typeof physicalShapeNormal;
  physicalShapeNormalPrepare: typeof physicalShapeNormalPrepare;
} = {
  physicalShapeNormal,
  physicalShapeNormalPrepare,
};

/** Fixed collider geometry can lend only its invariant normal prerequisites. */

/**
 * One fixed box face's unit normal and the half-extent axis that gives its
 * offset.
 */
interface IBoxPlane {
  /** The face's outward unit normal in box-local coordinates. */
  normal: IAutoMovieVector3;

  /** Which current half extent supplies the plane's offset, metres. */
  axis: "x" | "y" | "z";
}
/** Fixed metadata of one framed collider; no query point is retained. */
interface IPrepared {
  /** Actual parent/local centre. */
  centre: IAutoMovieVector3;

  /** Actual composed rotation. */
  rotation: IAutoMovieQuaternion;

  /** Capsule length direction in the query's common frame. */
  axis: IAutoMovieVector3;

  /** Common-to-polytope rotation. */
  inverse: IAutoMovieQuaternion;

  /** Hull owner planes or six original-order box planes; empty otherwise. */
  planes: readonly { normal: IAutoMovieVector3; offset: number }[];
}
