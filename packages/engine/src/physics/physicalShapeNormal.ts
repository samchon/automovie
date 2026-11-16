import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { physicalHullFaces } from "./physicalHullFaces";

/**
 * The outward unit normal of a collider at a point of its surface: a
 * sphere's radius through it, a capsule's from the nearest point of its
 * axis, and, for a box or a hull, the gradient of the smooth maximum of its
 * face planes (`SMOOTH`): the face normals weighed by how near the point
 * lies to each plane. Farther from edges, the closest face dominates; a
 * point that crosses an edge turns its normal continuously from one face's
 * to the next, where a face's own normal would step by their angle.
 * The fallback where the radius or the axis offset has no length.
 *
 * @param frame The segment's pose.
 * @param shape The collider.
 * @param point The point of its surface, in the frame `frame` is in.
 * @param fallback The direction returned where the normal has no direction.
 * @returns The outward unit normal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each kind's normal, the edge blend and the fallback.
 * @evidence contracts/development/implementation.md#principled-implementation A sphere's and a capsule's exact gradient; a polytope's normal as the gradient of the log-sum-exp smooth maximum of its face planes' signed heights, continuous across edges and dominated by the nearest face farther from edges.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per kind, one plane list for the box and the hull.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The weights are taken relative to the highest plane, so none overflows; a degenerate normal falls back instead of normalising a zero vector.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses physicalHullFaces and the engine's vector and quaternion owners. Six private fixed unit normals describe every box; offsets are read anew from the current half extents, and ordered scalar component sums avoid per-plane vector intermediates.
 * @evidence contracts/development/implementation.md#efficient-algorithms One height and one exponential weight per plane, in the original order; weighted components use three scalar sums and one final vector instead of two vectors per plane. A box builds six offset records without rebuilding its unit normals or per-axis mapping arrays.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The private six-normal table contains only fixed axis metadata. Per-query planes, heights and sums are released after return; no body, shape, transform, fallback or numerical reading is cached, and the resulting normal is fresh except the original borrowed fallback.
 */
export function physicalShapeNormal(
  frame: P.ITransform,
  shape: P.IShape,
  point: IAutoMovieVector3,
  fallback: IAutoMovieVector3,
): IAutoMovieVector3 {
  const centre: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, shape.transform.position),
  );
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    frame.rotation,
    shape.transform.rotation,
  );
  const radial: (from: IAutoMovieVector3) => IAutoMovieVector3 = (
    from: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    const r: IAutoMovieVector3 = Vector3.subtract(point, from);
    return Vector3.length(r) > BOUNDARY ? Vector3.normalize(r) : fallback;
  };
  if (shape.kind === "sphere") return radial(centre);
  if (shape.kind === "capsule") {
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
    const along: number = Math.max(
      -shape.halfLength,
      Math.min(
        shape.halfLength,
        Vector3.dot(Vector3.subtract(point, centre), axis),
      ),
    );
    return radial(Vector3.add(centre, Vector3.scale(axis, along)));
  }
  const o: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(rotation),
    Vector3.subtract(point, centre),
  );
  const planes: { normal: IAutoMovieVector3; offset: number }[] =
    shape.kind === "hull"
      ? physicalHullFaces(shape.points).faces
      : BOX.map(
          (
            plane: IBoxPlane,
          ): { normal: IAutoMovieVector3; offset: number } => ({
            normal: plane.normal,
            offset: shape.halfExtents[plane.axis],
          }),
        );
  const heights: number[] = planes.map(
    (plane: { normal: IAutoMovieVector3; offset: number }): number =>
      Vector3.dot(plane.normal, o) - plane.offset,
  );
  const top: number = Math.max(...heights);
  let x: number = 0;
  let y: number = 0;
  let z: number = 0;
  planes.forEach(
    (plane: { normal: IAutoMovieVector3; offset: number }, k: number): void => {
      const weight: number = Math.exp((heights[k]! - top) / SMOOTH);
      x += plane.normal.x * weight;
      y += plane.normal.y * weight;
      z += plane.normal.z * weight;
    },
  );
  const sum: IAutoMovieVector3 = { x, y, z };
  return Vector3.length(sum) > BOUNDARY
    ? Vector3.normalize(Quaternion.rotateVector(rotation, sum))
    : fallback;
}

/** One fixed box face's unit normal and the half-extent axis that gives its offset. */
interface IBoxPlane {
  /** The face's outward unit normal in box-local coordinates. */
  normal: IAutoMovieVector3;

  /** Which current half extent supplies the plane's offset, metres. */
  axis: "x" | "y" | "z";
}

/** Canonical face order: negative then positive X, Y and Z, as in the original plane construction. */
const BOX: readonly IBoxPlane[] = [
  { axis: "x", normal: { x: -1, y: 0, z: 0 } },
  { axis: "x", normal: { x: 1, y: 0, z: 0 } },
  { axis: "y", normal: { x: 0, y: -1, z: 0 } },
  { axis: "y", normal: { x: 0, y: 1, z: 0 } },
  { axis: "z", normal: { x: 0, y: 0, z: -1 } },
  { axis: "z", normal: { x: 0, y: 0, z: 1 } },
];

/** How wide, metres, a box's or a hull's normal blends across an edge (`physicalShapeNormal`), provisional: half the 10 mm a pressed skin gives, so a face's middle keeps its own normal (a face 30 mm off weighs e^-6 of it) and an edge turns within a fingertip's breadth. */
const SMOOTH: number = 0.005;

/** Metres under which a radius or a normal has no direction. */
const BOUNDARY: number = 1e-9;
